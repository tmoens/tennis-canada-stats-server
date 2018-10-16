import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VRRankingsItem } from './item.entity';
import {VRAPIService} from '../../VRAPI/vrapi.service';
import {getLogger} from 'log4js';
import {VRRankingsPublication} from '../publication/publication.entity';
import {PlayerService} from '../../player/player.service';
import {Player} from '../../player/player.entity';

const logger = getLogger('vrrankingsitemService');

@Injectable()
export class VRRankingsItemService {
  constructor(
    @InjectRepository(VRRankingsItem)
    private readonly repository: Repository<VRRankingsItem>,
    private readonly vrapi: VRAPIService,
    @Inject(forwardRef(() => PlayerService))
    private readonly playerService: PlayerService,
  ) {}

  async findAll(): Promise<VRRankingsItem[]> {
    return await this.repository.find();
  }

  async findByPubAndPlayer(player: Player, publication: VRRankingsPublication): Promise<VRRankingsItem> {
    return this.repository.findOne({
      where: {playerId: player.playerId, publicationId: publication.publicationId}});
  }

  async importVRRankingsListFromVR(
    publication: VRRankingsPublication): Promise<boolean> {
    let list = await this.vrapi.get(
      'Ranking/' + publication.rankingsCategory.typeCode +
      '/Publication/' + publication.publicationCode +
      '/Category/' + publication.rankingsCategory.categoryCode);

    // Because the xml2js parser is configured not to convert every single
    // child node into an array (explicitArray: false), it only creates an
    // array of RankingPublicationPoints s if there is more than one.
    // We want an array regardless of whether the rankings list has 0, 1 or more items
    if (null == list.RankingPublicationPoints) {
      list = [];
    } else if (Array.isArray(list.RankingPublicationPoints)) {
      list = list.RankingPublicationPoints;
    } else {
      list = [list.RankingPublicationPoints];
    }
    logger.info(list.length + ' rank list entries found');

    // loop through all the list items
    for (const apiListItem of list) {
      const item: VRRankingsItem = new VRRankingsItem();
      item.publication = publication;

      // make sure any player on the rankings list is known
      item.player = await this.playerService.findPlayerOrFacsimile({
        playerId: apiListItem.Player1.MemberID,
        firstName: '',
        lastName: apiListItem.Name,
        source: 'VR RankingList item'}, true);
      item.rank = parseInt(apiListItem.Rank, 10);
      item.points = parseFloat(apiListItem.Points);
      try {
        await this.repository.save(item);
      }
      catch (e) {
        logger.error('281312450 saving rankings item: ' + JSON.stringify(item));
      }
    }
    return true;
  }

  async renumberPlayer(fromPlayer: Player, toPlayer: Player): Promise<number> {
    const items: VRRankingsItem[] = await this.repository.find({playerId: fromPlayer.playerId});
    for (const item of items) {
      item.player = toPlayer;
      await this.repository.save(item);
    }
    logger.info('Renumbered player in Rankings Data ('
      + items.length + ' times) from ' +
      fromPlayer.playerId + ' to ' + toPlayer.playerId);
    return items.length;
  }
}