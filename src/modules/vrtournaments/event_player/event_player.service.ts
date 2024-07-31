import {Injectable, Inject, forwardRef} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {EventPlayer} from './event_player.entity';
import { getLogger } from 'log4js';
import { PlayerService } from '../../player/player.service';
import { Player } from '../../player/player.entity';
import {Event} from '../event/event.entity';
import {JobStats} from '../../../utils/jobstats';

const logger = getLogger('eventPlayerService');

@Injectable()
export class EventPlayerService {
  constructor(@InjectRepository(EventPlayer)
              private readonly repository: Repository<EventPlayer>,
              @Inject(forwardRef(() => PlayerService))
              private readonly playerService: PlayerService) {
  }

  async findAll(): Promise<EventPlayer[]> {
    return await this.repository.find();
  }

  // entriesData input is the list of entries from the vrapi call to
  // ..../Tournament/{code}/Event/{code}/Entry
  // Normally I would make the vrapi call here, but the caller (load Events)
  // needed to get its hands on entriesData before calling here.
  // NOTE: We are only saving the players we can identify concretely, i.e. those
  // who are in our database or who the VRAPI can tell us about.
  async loadRoster(event: Event, entriesData: any[], jobStats: JobStats): Promise<boolean> {
    for (const entryData of entriesData) {
      // An entry record always contains Player1 and in doubles events also contains Player2
      await this.loadEntry(event, entryData.Player1, jobStats);
      if (entryData.Player2) {
        await this.loadEntry(event, entryData.Player2, jobStats);
      }
    }
    return true;
  }

  async loadEntry(event: Event, entryData: any, jobStats: JobStats) {
    if (entryData && entryData.MemberID) {
      const player: Player = await
      this.playerService.findPlayerOrFacsimile(
        {playerId: entryData.MemberID}, false);
      if (player) {
        jobStats.bump('EventEntryCreated');
        const entry: EventPlayer = new EventPlayer(event, player);
        this.repository.save(entry).catch(reason => {
          logger.error('Failed to save an EventPlayer: ' + JSON.stringify(entryData, null, 2));
        });
      } else {
        jobStats.bump('EventEntryPlayerNotFound');
      }
    } else {
      jobStats.bump('EventEntryNoPlayerId');
    }
  }

  // Support the renumbering of a player who are on record as being in events.
  // Find all the eventPlayers records involving the FROM player and change
  // the player to the TO player
  async renumberPlayer(fromPlayer: Player, toPlayer: Player): Promise<number> {
    const entries: EventPlayer[] =
      await this.repository.find({playerId: fromPlayer.playerId});
    let entry: EventPlayer;
    for (entry of entries) {
      entry.playerId = toPlayer.playerId;
      await this.repository.save(entry)
        .catch(reason => {
          logger.error('Failed to renumber eventPlayer record. ' +
            'Reason: ' + reason +
            'eventPlayer: ' + JSON.stringify(entry, null, 2));
        });
    }
    logger.info('Renumbered player in Event Data (' +
      entries.length + ' times) from ' +
      fromPlayer.playerId + ' to ' + toPlayer.playerId);
    return entries.length;
  }
}
