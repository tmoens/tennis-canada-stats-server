import { ExternalEventResult } from './external-event-result.entity';

export class ExternalEventResultDTO {
  eventId: string;
  finishPosition: number;
  externalRankingPoints: string;
  manualPointAllocation: string | null;
  tcPoints: string;
  tournamentName: string;
  sanctioningBody: string;
  endDate: string;
  tournamentType: string;
  eventType: string;
  eventGender: string;
  eventDiscipline: string;
  pointsCategory: string;
  shortPointsCategory: string;
  playerName: string;
  drawSize: number;
  yob: number;
  externalId: string;
  internalId: number;

  constructor(r: ExternalEventResult, exchangeRate: number) {
    this.eventId = r.event.eventId;
    this.finishPosition = r.finishPosition;
    this.externalRankingPoints = r.externalRankingPoints.toString();
    this.manualPointAllocation = r.manualPointAllocation
      ? r.manualPointAllocation.toString()
      : null;
    // For some reason, the runtime is thinking that the player DOB is a string.
    // But the compiler and Webstorm (correctly) think it is a date and will not let me
    // treat it as a string. It is a "date" type in the database and a "Date" type in
    // the TypeORM entity file.
    // Soooo, I changed it to a string in the entity definition. barf.
    // this.yob = (r.player.DOB) ? r.player.DOB.getFullYear() : null; // <== should be
    this.yob = r.player.DOB ? parseInt(r.player.DOB.slice(0, 4), 10) : 0;
    this.tournamentName = r.event.tournament.name;
    this.sanctioningBody = r.event.tournament.sanctioningBody;
    this.tournamentType =
      r.event.tournament.sanctioningBody + '/' + r.event.tournament.category;
    this.eventType = r.event.eventType;
    this.eventGender = r.event.gender;
    this.eventDiscipline = r.event.discipline;
    this.endDate = r.event.tournament.endDate;
    this.playerName = r.player.firstName + ' ' + r.player.lastName;
    this.externalId = r.player.playerId;
    this.internalId = r.player.tcPlayer ? r.player.tcPlayer.playerId : null;
    this.drawSize = r.event.drawSize;

    if (r.event.ignoreResults) {
      this.tournamentName = this.tournamentName + ' (q)';
    }
    this.computePoints(r, exchangeRate);
    if (this.eventType === 'Open') {
      this.pointsCategory =
        (this.eventGender === 'F' ? 'W' : 'M') +
        this.eventDiscipline.slice(0, 1) +
        ' - ' +
        this.eventType;
      this.shortPointsCategory = [
        'M' === this.eventGender ? 'M' : 'W',
        this.eventDiscipline.slice(0, 1),
      ].join('');
    } else if (this.eventType === 'U18') {
      this.pointsCategory = [
        'M' === this.eventGender ? 'Boys' : 'Girls',
        'Under 18',
        this.eventDiscipline,
      ].join(' ');
      this.shortPointsCategory = [
        'M' === this.eventGender ? 'B' : 'G',
        this.eventType,
        this.eventDiscipline.slice(0, 1),
      ].join('');
    } else {
      // this would be bad.
    }
  }

  // In some case the user has overridden the "externalPoints pulled from the ITF API"
  // this function hides the fact from the caller.
  getExternalPoints(): number | null {
    return this.manualPointAllocation
      ? Number(this.manualPointAllocation)
      : Number(this.externalRankingPoints);
  }

  // Compute how many points are due to the player for this external result
  // Note to self: Why are these points not in the database???
  // Answer: Because if you ever what to change the way they are computed,
  // You have to go and change every record in the database.
  // Also, if you change the rating of any tournament,
  // you have to go and change the ratings for the results of that tournament.
  // Soooo, let's just compute the points whenever we need them.
  computePoints(r: ExternalEventResult, exchangeRate: number) {
    if (this.getExternalPoints() === null) {
      // But it is not possible to do if the external points are not known
      this.tcPoints = '0';
    } else {
      this.tcPoints = (this.getExternalPoints() * exchangeRate).toString();
    }
  }
}
