import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Brackets, Repository} from 'typeorm';
import {ExternalPlayer} from './external-player.entity';
import {PlayerService} from '../../player/player.service';
import {Player} from '../../player/player.entity';
import {getLogger} from 'log4js';

const logger = getLogger('playerService');

@Injectable()
export class ExternalPlayerService {
  constructor(
    @InjectRepository(ExternalPlayer)
    private readonly repo: Repository<ExternalPlayer>,
    private readonly playerService: PlayerService,
  ) {
  }

  async findAll(): Promise<ExternalPlayer[]> {
    return await this.repo.find();
  }

  async getExternalPlayers(missingVRID: boolean, searchString: string = null): Promise<any[]> {
    let q = await this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.tcPlayer', 'tcp')
      .orderBy('p.lastName')
      .addOrderBy('p.firstName');
    if (missingVRID) {
      q = q.where('p.internalId IS NULL');
    } else {
      q = q.where('1');
    }
    if (searchString) {
      q = q.andWhere(new Brackets(qb => {
            qb.where('p.lastName LIKE "%' + searchString + '%"')
              .orWhere('p.playerId LIKE "%' + searchString + '%"');
          }));
    }
    return await q.getMany();
  }

  // We receive a player record from the ITF API
  async loadFromITFAPI(bio: any): Promise<ExternalPlayer | null> {
    let ep: ExternalPlayer;
    ep = await this.repo.findOne(bio.PlayerId, {
      relations: ['tcPlayer'],
    });
    if (!ep) {
      ep = await this.repo.create({playerId: bio.PlayerId});
    }
    this.updateFromITFAPI(ep, bio);
    // if the ExternalPlayer has not been matched with an existing Tennis Canada player
    // try to do this now by an exact match on names, gender and data of birth.
    if (!ep.tcPlayer) {
      const tcPlayer: Player = await this.playerService.findUniquePlayerByAttributes(
        ep.firstName, ep.lastName, ep.gender, ep.DOB);
      if (tcPlayer) {
        ep.tcPlayer = tcPlayer;
      }
    }
    return await this.repo.save(ep);
  }

  // For a given external player, find a list of potential matches in the known
  // set of internal (that is, VR) players
  async FindVRMatches(externalPlayerId: string): Promise<any[]| null> {
    const externalPlayer: ExternalPlayer = await this.repo.findOne(externalPlayerId);
    if (!externalPlayer) {
      logger.error('Client asked for matches for non existent External Player Id: ' + externalPlayerId);
      return null;
    }
    return await this.playerService.findPlayersByLastName(externalPlayer.lastName);
  }

  updateFromITFAPI(p: ExternalPlayer, bio: any) {
    if (bio.coach) p.coach = bio.Coach;
    if (bio.BirthDate) p.DOB = bio.BirthDate.substr(0, 10);
    if (bio.FamilyName) p.lastName = bio.FamilyName;
    if (bio.Gender) p.gender = bio.Gender;
    if (bio.GivenName) p.firstName = bio.GivenName;
    if (bio.Height) p.height = bio.Height;
    if (bio.IPIN) p.ipin = bio.IPIN;
    if (bio.Nationality) p.nationality = bio.Nationality;
    if (bio.Residence) p.residence = bio.Residence;
    if (bio.Weight)p.weight = bio.Weight;
  }

  async setVRId(externalId: string, vrId: string): Promise<ExternalPlayer | null> {
    const ep: ExternalPlayer = await this.repo.findOne(externalId);
    if (!ep) {
      return null;
    }
    const vrp = await this.playerService.findById(vrId);
    if (!vrId) {
      return null;
    }
    ep.tcPlayer = vrp;
    return await this.repo.save(ep);
  }
}
