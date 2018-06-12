import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VRRankingsItem } from './item.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {StatsService} from "../../stats/stats.service";
import {getLogger} from "log4js";
import {VRRankingsPublication} from "../publication/publication.entity";
import {VRRankingsCategory} from "../category/category.entity";
import {isArray} from "util";
import {PlayerService} from "../../player/player.service";
import {Player} from "../../player/player.entity";

const UPDATE_COUNT = "vrrankingsitem_update";

const logger = getLogger("vrrankingsitemService");

@Injectable()
export class VRRankingsItemService {
  constructor(
    @InjectRepository(VRRankingsItem)
    private readonly repository: Repository<VRRankingsItem>,
    private readonly statsService: StatsService,
    private readonly vrapi: VRAPIService,
    @Inject(forwardRef(() => PlayerService))
    private readonly playerService: PlayerService,
  ) {}

  async findAll(): Promise<VRRankingsItem[]> {
    return await this.repository.find();
  }

  async importVRRankingsListFromVR(
    publication:VRRankingsPublication,
    category: VRRankingsCategory): Promise<boolean> {
    let list = await this.vrapi.get(
      "Ranking/" + publication.typeCode +
      "/Publication/" + publication.publicationCode +
      "/Category/" + category.categoryCode);

    // Because the xml2js parser is configured not to convert every single
    // child node into an array (explicitArray: false), it only creates an
    // array of RankingPublicationPoints s if there is more than one.
    // We want an array regardless of whether the rankings list has 0, 1 or more items
    if (null == list.RankingPublicationPoints) {
      list = [];
    } else if (isArray(list.RankingPublicationPoints)) {
      list = list.RankingPublicationPoints;
    } else {
      list = [list.RankingPublicationPoints];
    }
    logger.info(list.length + " rank list entries found");

    // loop through all the list items
    let apiListItem:any = {};
    for (let i = 0; i < list.length; i++) {
      apiListItem = list[i];
      let item: VRRankingsItem = new VRRankingsItem();
      item.category = category;
      item.publication = publication;
      // make sure any player on the rankings list is known

      item.player = await this.playerService.findPlayerOrFacsimile({
        playerId: apiListItem.Player1.MemberID,
        firstName: "",
        lastName: apiListItem.Name,
        source: "VR RankingList item"});
      item.rank = parseInt(apiListItem.Rank);
      item.points = parseFloat(apiListItem.Points);
      await this.repository.save(item);
    }
    return true;
  }

  async renumberPlayer(fromPlayer:Player, toPlayer:Player): Promise<boolean> {
    let items: VRRankingsItem[] = await this.repository.find({playerId: fromPlayer.playerId});
    let item: VRRankingsItem;
    for (let i = 0; i < items.length; i++) {
      item = items[i];
      item.player = toPlayer;
      await this.repository.save(item);
    }
    logger.info("Renumbered player in Rankings Data ("
      + items.length + " times) from " +
      fromPlayer.playerId + " to " + toPlayer.playerId);
    return true;
  }
}