import * as Cell from 'xlsx-populate/lib/Cell.js';

export class IdentityCheckDTO {
  playerId: string;
  firstName: string;
  lastName: string;
  gender: string;
  DOB: Date;
  postalCode: string;
  email: string;
  phone1: number;
  phone2: number;
  phone3: number;
}

export class PlayerMatchCandidate {
  score: number;
  playerId: FieldMatch;
  firstName: FieldMatch;
  lastName: FieldMatch;
  postalCode: FieldMatch;
  gender: FieldMatch;
  DOB: FieldMatch;
  email: FieldMatch;
  phone1: FieldMatch;
  phone2: FieldMatch;
  phone3: FieldMatch;
}

export class FieldMatch {
  colors: string[] = [];

  constructor(public code: MatchCode = MatchCode.NO_MATCH,
              public matchNote: string = '',
              public score: number = 0) {
    this.colors[MatchCode.NO_MATCH] = 'f2f2f2';
    this.colors[MatchCode.MATCH] = 'b9f489';
    this.colors[MatchCode.EFFECTIVE_MATCH] = 'b9f489';
    this.colors[MatchCode.PROBABLE_MATCH] = 'ceefb3';
    this.colors[MatchCode.POSSIBLE_MATCH] = 'e2f2d5';
    this.colors[MatchCode.MISMATCH] = 'ffd1d1';
  }
  toCell(c: Cell) {
    c.value(this.matchNote);
    switch (this.code) {
      case MatchCode.NO_MATCH:
        c.style('fill',  this.colors[MatchCode.NO_MATCH]);
        break;
      case MatchCode.MATCH:
        c.style('fill',  this.colors[MatchCode.MATCH]);
        break;
      case MatchCode.EFFECTIVE_MATCH:
        c.style('fill',  this.colors[MatchCode.EFFECTIVE_MATCH]);
        break;
      case MatchCode.PROBABLE_MATCH:
        c.style('fill',  this.colors[MatchCode.PROBABLE_MATCH]);
        break;
      case MatchCode.POSSIBLE_MATCH:
        c.style('fill',  this.colors[MatchCode.POSSIBLE_MATCH]);
        break;
      case MatchCode.MISMATCH:
        c.style('fill', this.colors[MatchCode.MISMATCH]);
        break;
      default:
    }
  }
}

export enum MatchCode {
  MISMATCH = 0,
  NO_MATCH = 1,
  POSSIBLE_MATCH = 3,
  PROBABLE_MATCH = 6,
  EFFECTIVE_MATCH = 9,
  MATCH = 10,
}

export interface HereSearchResult {
  Relevance: number;
  MatchLevel: string;
  MatchQuality: any;
  Location: HereLocation;
}
export interface HereLocation {
  LocationId: string;
  Address: HereAddress;
}

export interface HereAddress {
  Label: string;
  Country: string;
  State: string;
  PostalCode: string;
}