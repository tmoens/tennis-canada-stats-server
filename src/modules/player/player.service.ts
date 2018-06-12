import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity'
import {VRAPIService} from "../VRAPI/vrapi.service";
import {StatsService} from "../stats/stats.service";
import {getLogger} from "log4js";
import {MatchPlayerService} from "../vrtournaments/match_player/match_player.service";
import {VRRankingsItemService} from "../vrrankings/item/item.service";

const CREATION_COUNT = "player_creation";
const UNKNOWN_CREATION_COUNT = "player_unknown_creation";
const EXISTS_COUNT = "player_exists";
const UNKNOWN = "unknown";
const logger = getLogger("playerService");

@Injectable()
export class PlayerService {
  private playerZero: Player;
  constructor(
    @InjectRepository(Player)
    private readonly repository: Repository<Player>,
    private readonly statsService: StatsService,
    private readonly vrapi: VRAPIService,
    @Inject(forwardRef(() => MatchPlayerService))
    private readonly matchPlayerService: MatchPlayerService,
    @Inject(forwardRef(() => VRRankingsItemService))
    private readonly vrRankingsItemService: VRRankingsItemService,

  ) {}

  async findAll(): Promise<Player[]> {
    return await this.repository.find();
  }

  // A special player that is used as a stand-in for a player we do not know.
  async getPlayerZero(): Promise<Player> {
    if (null != this.playerZero) {
      return this.playerZero;
    }
    this.playerZero = await this.findPlayer(0);
    if (null != this.playerZero) {
      return this.playerZero;
    }
    this.playerZero = new Player();
    this.playerZero.playerId = 0;
    this.playerZero.firstName = "UnknownFN";
    this.playerZero.lastName = "UnknownLN";
    await this.repository.save(this.playerZero);
    return this.playerZero;
  }

  // Simple lookup.
  async findPlayer(playerId):Promise<Player|null> {
    return await this.repository.findOne(playerId);
  }

  // Mostly this is a simple lookup.  But if the player has been renumbered,
  // we follow the trail.  This makes it super important that the trail has no
  // cycles. a->b, b->c, c->a would be deadly.
  // But that job is handled when we add a renumbering.
  async findRenumberedPlayer(playerId):Promise<Player|null> {
    let p:Player = await this.findPlayer(playerId);
    if (null == p) return null;
    if (null == p.renumberedToPlayerId) return p;
    return this.findRenumberedPlayer(p.renumberedToPlayerId);
  }

  async findPlayerOrTryToCreate(playerId:any, source?:string):Promise<Player|null> {
    if (!this.validatePlayerId(playerId)) {
      return null;
    }
    let p:Player = await this.findPlayer(playerId);
    if (null == p) {
      // not found, so let's try loading from the VRAPI
      p = await this.loadPlayerFromVRAPI(playerId, source);
    }
    return p;
  }

  // Some client gets its hands on a VR player ID and possibly more scraps of player info.
  // It wants to lookup that player.
  async findPlayerOrFacsimile(config:PlayerConfig):Promise<Player> {
    // if we get an invalid playerId, we are pretty much hooped
    // so this is the "unknown player" case and we just log it an return playerZero
    // Note that the "unknown player" is very different from "no Player" like in a Bye
    // situation.
    if (!this.validatePlayerId(config.playerId)) {
      logger.warn("Unable to find or create a player for " +
        JSON.stringify(config), ". Using the stand-in player zero instead.");
      return this.getPlayerZero();
    }

    let p:Player;
    // First let's try the simple lookup of the player.
    // (but if that player has been renumbered, lookup the player it was renumbered to)
    p = await this.findRenumberedPlayer(config.playerId);
    if (p != null) return p;

    // Failing that, we will go check the VR API to see if VR knows about the player
    // and if so we will call it into existence and return it.
    p = await this.loadPlayerFromVRAPI(config.playerId, config.source);
    if (p != null) return p;

    // Failing that, we will try and make one up with whatever scraps of info
    // the client gives us
    p = await this.createPlayerOnSpec(config);
    if (p! = null) return p;

    // and in the logically unreachable code department
    logger.error("Programming Error 2799810923 failed to find or create a player");
    return this.getPlayerZero();
  }

  async loadPlayerFromVRAPI(playerId:number, source?:string): Promise<Player|null> {
    // Lets try to use the VR API to get the player details.
    let apiPlayer = await this.vrapi.get("Player/" + playerId);
    if (null == apiPlayer.Player) {
      // no such luck
      return null;
    }
    // by golly, we found it.
    let p = new Player();
    p.buildFromVRAPIObj(apiPlayer.Player);
    p.source = "VR Player API/" + source;
    p = await this.repository.save(p);
    this.statsService.bump(CREATION_COUNT);
    return p;
  }

  async createPlayerOnSpec(config:PlayerConfig): Promise<Player|null> {
    if (!this.validatePlayerId(config.playerId)) {
      return null;
    }
    let p:Player = new Player();
    p = new Player();
    p.playerId = config.playerId;
    p.firstName = (config.firstName) ? config.firstName : "UnknownFN";
    p.lastName = (config.lastName) ? config.lastName : "UnknownFN";
    if (null == config.source) {
      p.source = "On Spec";
    } else {
      p.source = config.source + " (on spec)";
    }
    return await this.repository.save(p);
  }

  validatePlayerId(playerId:any):boolean {
    if (null == playerId ) {
      logger.warn("Undefined player ID");
      return false;
    }
    if (isNaN(Number(playerId))) {
      logger.warn("Non numeric playerId: " + playerId);
      return false;
    }
    let pid  = Number(playerId);
    if (10000000 > pid || 99999999 < pid) {
      logger.warn("Player ID out of range: " + playerId);
      return false;
    }
    return true;
  }

  // ============== Player renumbering ======================================
  // Normally what happens is the Fred creates a VR account with a VRID.
  // Then he forgets his password and goes and creates another account
  // in spite of how hard we try to convince him not to.
  // Then his results and rankings start to look screwy and he
  // complains that the system is "not optimal"

  // Someone then goes and merges the two IDs in the VR system

  // We learn about the renumbering long after we have lots of data under
  // both the old Id and the new Id.

  // So we have two problems
  // 1) fixing the data we already have
  // 2) what do we do if, in the future, we get more data from the VR API under the old id?
  //    which requires that we keep track of all renumberings ever given to us.
  // It is also necessary to make sure we do not allow circular renumberings.
  // Renumber a player.
  async renumberPlayer(
    fromPlayerId:number, toPlayerId:number,
    fromFirstName:string, toFirstName:string,
    fromLastName:string, toLastName:string,
    mergeDate:string): Promise<string | null> {
    let response: string = "";

    if (!this.validatePlayerId(fromPlayerId)) {
      response = "Attempt to renumber FROM bad playerId: " + fromPlayerId;
      logger.error(response);
      return response;
    }

    if (!this.validatePlayerId(fromPlayerId)) {
      response = "Attempt to renumber TO a bad playerId: " + toPlayerId;
      logger.error(response);
      return response;
    }

    // Let's find (or create) the player we are trying to renumber.
    let fromPlayer: Player = await this.findPlayerOrTryToCreate(fromPlayerId, "*fromPlayer* in renumbering");
    if (null == fromPlayer) {
      // fromId is not in the database and not available in the VRAPI.
      // Still we cannot give up because it is possible that we may
      // receive data about this player through the API in the future.
      // So we have to go ahead and create the player on spec.
      fromPlayer = await this.createPlayerOnSpec({
        playerId: fromPlayerId,
        firstName: fromFirstName,
        lastName: fromLastName,
        source: "*fromPlayer* in renumbering"
      });
    } else {
      // check - you cannot renumber the same player to two different things.
      if (null != fromPlayer.renumberedToPlayerId) {
        response = "Attempt to renumber from " +
          fromPlayerId + " to " + toPlayerId + " but " + fromPlayerId +
          " is already renumbered to " + fromPlayer.renumberedToPlayerId;
        logger.error(response);
        return response;
      }
    }

    // The player you are trying to renumber TO must be known.
    // Lets look up the TO player, but chase down its renumbering first.
    let toPlayer: Player = await this.findPlayerOrTryToCreate(toPlayerId, "*toPlayer* in renumbering");
    if (null == toPlayer) {
      // toId is not in the database and not available in the VRAPI.
      // Still we cannot give up because it is possible that we may
      // receive data about this player through the API in the future.
      // So we have to go ahead and create the player on spec.
      toPlayer = await this.createPlayerOnSpec({
        playerId: toPlayerId,
        firstName: toFirstName,
        lastName: toLastName,
        source: "*toPlayer* in renumbering"
      });
    }

    // Here is where we eradicate attempts to create renumbering loops.
    // We chased the renumbeing loop on the TO id.
    // if it ended at the FROM id, it was an attempt to create a loop.
    // e.g if existing renumberings were a->b, b->c, c->d
    // and we were asked to renumber FROM d TO a
    // it would be disallowed because a renumbers to d and so
    // we disallow d to a.  Likewise if we try to renumber FROM d TO b
    // it will also be disallowed because b renumbers to d.
    // Note that the cases of c->a, b->a and c->b are all teken care of by the
    // fact that you cannot renumber one id to two differnt Ids (above)
    let renumberedToPlayer: Player = await this.findRenumberedPlayer(toPlayerId);
    if (renumberedToPlayer.playerId == fromPlayerId) {
      response = "Attempt to renumber from " +
        fromPlayerId + " to " + toPlayerId + " but the reverse mapping already " +
        "exists (directly or indirectly)";
      return response;
    }

    // Now just add the renumbering.
    fromPlayer.renumberedToPlayer = toPlayer;
    this.repository.save(fromPlayer);

    // Now we have to do the actual renumbering of historical data
    // in the database. PlayerIDs can show up in two places:
    // - any time a player has played a match (MatchPlayer)
    // - any time a player shows up in a ranking list (VRRankingsItem)
    await this.matchPlayerService.renumberPlayer(fromPlayer, toPlayer);
    await this.vrRankingsItemService.renumberPlayer(fromPlayer, toPlayer);
  }
}

export interface PlayerConfig {
  playerId:any;
  firstName?:string;
  lastName?:string;
  DOB?:string;
  source?:string;
}