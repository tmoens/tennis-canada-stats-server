import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';
import {VRAPIService} from '../VRAPI/vrapi.service';
import {getLogger} from 'log4js';
import {MatchPlayerService} from '../vrtournaments/match_player/match_player.service';
import {VRRankingsItemService} from '../vrrankings/item/item.service';
import {JobState, JobStats} from '../../utils/jobstats';

const logger = getLogger('playerService');

@Injectable()
export class PlayerService {
  personImportJobStats: JobStats;
  private playerZero: Player;
  constructor(
    @InjectRepository(Player)
    private readonly repository: Repository<Player>,
    private readonly vrapi: VRAPIService,
    @Inject(forwardRef(() => MatchPlayerService))
    private readonly matchPlayerService: MatchPlayerService,
    @Inject(forwardRef(() => VRRankingsItemService))
    private readonly vrRankingsItemService: VRRankingsItemService,

  ) {
    this.personImportJobStats = new JobStats('playerImport');
  }

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
    this.playerZero.firstName = 'UnknownFN';
    this.playerZero.lastName = 'UnknownLN';
    await this.repository.save(this.playerZero);
    this.playerZero = await this.findPlayer(0);
    return this.playerZero;
  }

  // Simple lookup.
  async findPlayer(playerId): Promise<Player|null> {
    return await this.repository.findOne(playerId);
  }

  // Mostly this is a simple lookup.  But if the player has been renumbered,
  // we follow the trail.  This makes it super important that the trail has no
  // cycles. a->b, b->c, c->a would be deadly.
  // But that job is handled when we add a renumbering.
  async findRenumberedPlayer(playerId): Promise<Player|null> {
    try {
      const p: Player = await this.findPlayer(playerId);
      if (null == p) return null;
      if (null == p.renumberedToPlayerId) return p;
      return this.findRenumberedPlayer(p.renumberedToPlayerId);
    }
    catch (e) {
      logger.error('Error 18897300: failure findRenumberedPlayer: ' + playerId);
      return null;
    }
  }

  async findPlayerOrTryToCreate(playerId: any, source?: string): Promise<Player|null> {
    let p: Player = await this.findPlayer(playerId);
    if (null == p) {
      // not found, so let's try loading from the VRAPI
      p = await this.loadPlayerFromVRAPI(playerId, source);
    }
    return p;
  }

  // Some client gets its hands on a VR player ID and possibly more scraps of player info.
  // It wants to lookup that player.
  async findPlayerOrFacsimile(config: PlayerConfig): Promise<Player> {
    // if we get an invalid playerId, we are pretty much hooped
    // so this is the "unknown player" case and we just log it an return playerZero
    // Note that the "unknown player" is very different from "no Player" like in a Bye
    // situation.
    if (!PlayerService.validatePlayerId(config.playerId)) {
      logger.warn('74546100 Failed to findPlayerOrFacsimile invalid playerId. ' +
        'Here is the player data: ' + JSON.stringify(config));
      return this.getPlayerZero();
    }

    let p: Player;
    // First let's try the simple lookup of the player.
    // (but if that player has been renumbered, lookup the player it was renumbered to)
    p = await this.findRenumberedPlayer(config.playerId);
    if (p != null) return p;

    // Failing that, we will go check the VR API to see if VR knows about the player
    // and if so we will call it into existence and return it.
    p = await this.loadPlayerFromVRAPI(config.playerId, config.source);
    if (p != null) {
      return p;
    }

    // Failing that, we will try and make one up with whatever scraps of info
    // the client gives us
    p = await this.createPlayerOnSpec(config);
    if (p != null) return p;

    // and in the logically unreachable code department
    // TODO 2018-06-13 which was of course reached immediately when loading vrRankingsItem
    // and failing becuase of duplicate Ids
    logger.error('2799810923 failed to findPlayerOrFacsimile with configuration: ' + JSON.stringify(config));
    return this.getPlayerZero();
  }

  async loadPlayerFromVRAPI(playerId: number, source?: string): Promise<Player|null> {
    // Lets try to use the VR API to get the player details.
    const apiPlayer = await this.vrapi.get('Player/' + playerId);
    if (null == apiPlayer.Player) {
      // no such luck
      return null;
    }
    // by golly, we found it.
    let p = new Player();
    p.buildFromVRAPIObj(apiPlayer.Player);
    p.source = 'VR Player API/' + source;
    try {
      p = await this.repository.save(p);
    } catch (e) {
      // TODO This keeps getting hit when loading rankings - duplicate key
      // It is a bit of a mystery because we only go load a player from
      // the vrapi if the player is not already in the database.
      // so there is a timing issue.
      // Note:  When the problem happens, there are two consecutive VRAPI calls for the same player.
      logger.error('89072317 loadPlayerFromVRAPI failed to save ' + p.playerId);
    }
    // after you save(), if you do not find() again before you save() again
    // you get a duplicate id error.  I do not understand why this is, but it is.
    // Since the client may well save() the returned value better do a find.
    p = await this.findPlayer(p.playerId);
    return p;
  }

  async createPlayerOnSpec(config: PlayerConfig): Promise<Player|null> {
    if (!PlayerService.validatePlayerId(config.playerId)) {
      return null;
    }
    let p: Player = new Player();
    p.playerId = config.playerId;
    p.firstName = (config.firstName) ? config.firstName : 'UnknownFN';
    p.lastName = (config.lastName) ? config.lastName : 'UnknownFN';
    if (null == config.source) {
      p.source = 'On Spec';
    } else {
      p.source = config.source + ' (on spec)';
    }
    await this.repository.save(p);
    // after you save(), if you do not find() again before you save() again
    // you get a duplicate id error.  I do not understand why this is, but it is.
    // Since the client may well save() the returned value better do a find.
    p = await this.findPlayer(p.playerId);
    return p;
  }

  static validatePlayerId(playerId: number): boolean {
    let message: string = null;
    if (null == playerId ) {
      message = 'Undefined player ID';
      logger.warn(message);
      return false;
    }
    if (isNaN(Number(playerId))) {
      message = 'Non numeric playerId: ' + playerId;
      logger.warn(message);
      return false;
    }
    const pid  = Number(playerId);
    if (10000000 > pid || 99999999 < pid) {
      message = 'Player ID out of range: ' + playerId;
      logger.warn(message);
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
  async renumberPlayer( pmr: PlayerMergeRecord ): Promise<string[]> {
    let message: string;
    const response: string[] = [];

    message = `Request to renumber player from: ` +
      `${pmr.fromPlayerId} (${pmr.fromFirstName} ${pmr.fromLastName}) ` +
      `to: ${pmr.toPlayerId} (${pmr.toFirstName} ${pmr.toLastName})`;
    response.push(message);
    logger.info(message);

    if (!PlayerService.validatePlayerId(pmr.fromPlayerId)) {
      message = `Error: attempt to renumber FROM bad playerId: ${pmr.fromPlayerId}`;
      response.push(message);
      logger.error(message);
      return response;
    }

    if (!PlayerService.validatePlayerId(pmr.toPlayerId)) {
      message = `Error: attempt to renumber TO a bad playerId: ${pmr.toPlayerId}`;
      response.push(message);
      logger.error(message);
      return response;
    }

    // Let's find (or create) the player we are trying to renumber.
    let fromPlayer: Player =
      await this.findPlayerOrTryToCreate(pmr.fromPlayerId, '*fromPlayer* in renumbering');
    if (null == fromPlayer) {
      // fromId is not in the database and not available in the VRAPI.
      // Still we cannot give up because it is possible that we may
      // receive data about this player through the API in the future.
      // So we have to go ahead and create the player on spec.
      fromPlayer = await this.createPlayerOnSpec({
        playerId: pmr.fromPlayerId,
        firstName: pmr.fromFirstName,
        lastName: pmr.fromLastName,
        source: '*fromPlayer* in renumbering',
      });
      response.push(`*fromPlayerId* ${pmr.fromPlayerId} not found in database or VR API, created automatically.`);
    } else if (fromPlayer.renumberedToPlayerId === pmr.toPlayerId) {
      message = 'Already done';
      response.push(message);
      // not log worthy.
      return response;
    } else {
      // you cannot renumber the same player to two different things.
      if (null != fromPlayer.renumberedToPlayerId) {
        message = 'Error: attempt to renumber from ' +
          pmr.fromPlayerId + ' to ' + pmr.toPlayerId + ' but ' + pmr.fromPlayerId +
          ' is already renumbered to ' + fromPlayer.renumberedToPlayerId;
        response.push(message);
        logger.error(message);
        return response;
      }
    }

    // The player you are trying to renumber TO must also be known.
    // Lets look up the TO player.
    let toPlayer: Player = await this.findPlayerOrTryToCreate(pmr.toPlayerId, '*toPlayer* in renumbering');
    if (null === toPlayer) {
      // toId is not in the database and not available in the VRAPI.
      // Still we cannot give up because it is possible that we may
      // receive data about this player through the API in the future.
      // So we have to go ahead and create the player on spec.
      toPlayer = await this.createPlayerOnSpec({
        playerId: pmr.toPlayerId,
        firstName: pmr.toFirstName,
        lastName: pmr.toLastName,
        source: '*toPlayer* in renumbering',
      });
      response.push(`*toPlayerId* ${pmr.toPlayerId} not found in database or VR API, created automatically.`);
    }

    // Here is where we prevent renumbering loops.
    // We chase the renumbering of the TO id.
    // If eventually renumbers to the FROM id, it was an attempt to create a loop.
    // e.g. if existing renumberings were a->b, b->c, c->d
    // and we were asked to renumber FROM d TO a,
    // it would be disallowed because a renumbers to d.
    // Likewise if we try to renumber FROM d TO b
    // will also be disallowed because b renumbers to d.
    // Same for c to d and also d to d (the shortest loop of them all).
    // Note that the erroneous renumbering requests of c->a, b->a and c->b
    // are already taken care of by the fact that you cannot renumber one id
    // to two different Ids (above)
    const renumberedToPlayer: Player = await this.findRenumberedPlayer(pmr.toPlayerId);
    if (renumberedToPlayer.playerId === pmr.fromPlayerId) {
      message = 'Error: attempt to renumber from ' +
        pmr.fromPlayerId + ' to ' + pmr.toPlayerId + ' but the reverse mapping already ' +
        'exists (directly or indirectly)';
      response.push(message);
      logger.error(message);
      return response;
    }

    // All the hoops have been jumped, so now we do the renumbering.
    response.push(`Renumbering from ${pmr.fromPlayerId} (${fromPlayer.firstName} ${fromPlayer.lastName})
      to ${pmr.toPlayerId} (${toPlayer.firstName} ${toPlayer.lastName})`);

    // Now just add the renumbering to the *FROM* player record.
    fromPlayer.renumberedToPlayer = toPlayer;
    await this.repository.save(fromPlayer);

    // Now we have to do the actual renumbering of historical data
    // in the database. PlayerIDs can show up in two places:
    // - any time a player has played a match (MatchPlayer)
    // - any time a player shows up in a ranking list (VRRankingsItem)
    let count = await this.matchPlayerService.renumberPlayer(fromPlayer, toPlayer);
    response.push('Merged ' + count + ' matches');
    count = await this.vrRankingsItemService.renumberPlayer(fromPlayer, toPlayer);
    response.push('Merged ' + count + ' ranking entries');
    return response;
  }

  // This does the work of importing a VR "All Persons" report.
  // Note:  We previously did this with xlsx js but loading the large
  // xlsx file was blocking the whole node server.
  // Furthermore the xlsx library does not allow a streaming read so we
  // reverted to .csv.
  async importVRPersons(players: any[]) {
    logger.info('**** Starting player import.');
    this.personImportJobStats = new JobStats('Import players from VR "All Persons" admin report.');
    this.personImportJobStats.setStatus(JobState.IN_PROGRESS);
    this.personImportJobStats.toDo = players.length;

    logger.info('Importing ' + players.length + ' players.');
    let player: Player;
    let address: string[];
    let count: number = 0;
    for (const playerData of  players) {
      player = await this.findPlayer(playerData.memberid);
      if (null == player) {
        player = new Player();
        player.playerId = playerData.memberid;
        player.source = 'VR All Persons Report';
        this.personImportJobStats.bump('player created');
      }
      this.personImportJobStats.currentActivity = `Loading player ${player.playerId}).`;
      // This is the order in which the fields appear in the excel spreadsheet.
      // skip playerData.code
      player.lastName = playerData.lastname;
      // skip playerData.lastname2
      // skip playerData.middlename
      player.firstName = playerData.firstname;
      address = [];
      address.push(playerData.address);
      if ('' !== playerData.address2) address.push(playerData.address2);
      if ('' !== playerData.address3) address.push(playerData.address3);
      player.address = address.join(', ');
      player.postalCode = playerData.postalcode;
      player.city = playerData.city;
      player.province = playerData.state;
      player.gender = playerData.gender;
      player.DOB = playerData.dob;
      // strip special characters from phone numbers
      player.phone = playerData.phone.replace(/\D/g, '');
      player.phone2 = playerData.phone2.replace(/\D/g, '');
      player.mobile = playerData.mobile.replace(/\D/g, '');
      // skip playerData.fax
      // skip playerData.fax2
      player.email = playerData.email;
      // skip playerData.website
      try {
        await this.repository.save(player);
        this.personImportJobStats.bump('player saved');
      }
      catch (e) {
        logger.error('656120901 Failed to save/update player during import.\n' +
          JSON.stringify(playerData));
        this.personImportJobStats.bump('player save errors');
      }
      count++;
      this.personImportJobStats.bump('done');
      if (0 === count % 100) logger.info('\t done: ' + count);
    }
    this.personImportJobStats.status = JobState.DONE;
    logger.info('\t Loaded: ' + players.length + ' players.');
    logger.info('**** Ending player import.');

    return true;
  }
}

export interface PlayerConfig {
  playerId: any;
  firstName?: string;
  lastName?: string;
  DOB?: string;
  source?: string;
}

export interface PlayerMergeRecord {
  fromPlayerId: number;
  toPlayerId: number;
  fromLastName?: string;
  toLastName?: string;
  fromFirstName?: string;
  toFirstName?: string;
  date?: string;
}
