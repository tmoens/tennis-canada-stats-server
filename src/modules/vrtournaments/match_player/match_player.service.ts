import {Injectable, Inject, forwardRef} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchPlayer } from './match_player.entity';
import { getLogger } from 'log4js';
import { Match } from '../match/match.entity';
import { PlayerService } from '../../player/player.service';
import { Player } from '../../player/player.entity';

const MATCH_DATA = 'VR Match Data';
const logger = getLogger('matchPlayerService');

@Injectable()
export class MatchPlayerService {
  constructor(@InjectRepository(MatchPlayer)
              private readonly repository: Repository<MatchPlayer>,
              @Inject(forwardRef(() => PlayerService))
              private readonly playerService: PlayerService) {
  }

  async findAll(): Promise<MatchPlayer[]> {
    return await this.repository.find();
  }

  async importMatchPlayersFromVR(match: Match, matchData: any): Promise<boolean> {
    let player: Player;
    let mp: MatchPlayer;
    // figure out who the players are and make sure they are in the database.
    if (null != matchData.Team1.Player1) {
      player = await this.findPlayer(matchData.Team1.Player1);
      mp = new MatchPlayer(match, player, 1, 1);
      await this.repository.save(mp)
        .catch(reason => this.failedToSaveMatchPlayer(mp, reason));
    }
    if (null != matchData.Team1.Player2) {
      player = await this.findPlayer(matchData.Team1.Player2);
      mp = new MatchPlayer(match, player, 1, 2);
      await this.repository.save(mp)
        .catch(reason => this.failedToSaveMatchPlayer(mp, reason));
    }
    if (null != matchData.Team2.Player1) {
      player = await this.findPlayer(matchData.Team2.Player1);
      mp = new MatchPlayer(match, player, 2, 1);
      await this.repository.save(mp)
        .catch(reason => this.failedToSaveMatchPlayer(mp, reason));
    }
    if (null != matchData.Team2.Player2) {
      player = await this.findPlayer(matchData.Team2.Player2);
      mp = new MatchPlayer(match, player, 2, 2);
      await this.repository.save(mp)
        .catch(reason => this.failedToSaveMatchPlayer(mp, reason));
    }
    return true;
  }

  failedToSaveMatchPlayer(mp: MatchPlayer, reason: any) {
    logger.error('Failed to save matchPlayer record. ' +
      'Reason: ' + reason +
      'matchPlayer: ' + JSON.stringify(mp, null, 2));
  }

  async findPlayer(matchPlayerData: any): Promise<Player> {
    return this.playerService.findPlayerOrFacsimile({
      playerId: matchPlayerData.MemberID,
      firstName: matchPlayerData.Firstame,
      lastName: matchPlayerData.Lastname,
      source: MATCH_DATA}, false);
  }

  // Support the renumbering of a player for whome match data already exists.
  // Find all the matchPlayers records involving the FROM player and change
  // the player to the TO player
  async renumberPlayer(fromPlayer: Player, toPlayer: Player): Promise<number> {
    const matchPlayers: MatchPlayer[] =
      await this.repository.find({playerId: fromPlayer.playerId});
    let mp: MatchPlayer;
    for (mp of matchPlayers) {
      mp.playerId = toPlayer.playerId;
      await this.repository.save(mp)
        .catch(reason => {
          logger.error('Failed to renumber matchPlayer record. ' +
            'Reason: ' + reason +
            'matchPlayer: ' + JSON.stringify(mp, null, 2));
        });
    }
    logger.info('Renumbered player in Match Data (' +
      matchPlayers.length + ' times) from ' +
      fromPlayer.playerId + ' to ' + toPlayer.playerId);
    return matchPlayers.length;
  }
}
