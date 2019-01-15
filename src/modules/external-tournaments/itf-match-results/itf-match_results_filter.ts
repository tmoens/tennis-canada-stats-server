export class IFTMatchResultsFilter {
  playerId: string = null;
  internalId: string = null;
  lastName: string = null;
  tournamentName: string = null;
  sanctioningBody: string = null;
  category: string = null;
  subCategory: string = null;
  start: string;
  end: string;
  // sort order 1 = Player Name/StartDate, 2 = StartDate/Tournament Name/Player Name
  sortOrder: number;
}
