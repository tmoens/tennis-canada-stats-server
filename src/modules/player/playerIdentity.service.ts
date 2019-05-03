import {FieldMatch, IdentityCheckDTO, MatchCode, PlayerMatchCandidate} from './IdentityCheckDTO';
import {Player} from './player.entity';
import {ExternalapiService} from '../externalAPIModule/externalapi.service';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {JobState, JobStats} from '../../utils/jobstats';
import {NickNameService} from '../externalAPIModule/nicknameService';
import {ConfigurationService} from '../configuration/configuration.service';
import * as moment from 'moment';
import * as XlsxPopulate from 'xlsx-populate/lib/XlsxPopulate.js';
import * as Workbook from 'xlsx-populate/lib/Workbook.js';
import * as Cell from 'xlsx-populate/lib/Cell.js';
import * as Sheet from 'xlsx-populate/lib/Sheet.js';
import * as Column from 'xlsx-populate/lib/Column.js';
import * as Row from 'xlsx-populate/lib/Row.js';
import * as Range from 'xlsx-populate/lib/Range.js';

// 2019-04-30 I am using xlsx-populate library instead of sheetjs for this one because it allows
// me to format the output sheet as I need.  Sheet JS wanted $500 for a "pro" version to do that.
const ADDRESS = 'Address';
const BIRTH_DATE = 'Birthdate';
const CANDIDATE = 'Candidate';
const CITY = 'City';
const CLUB_NUMBER = 'ClubNumber';
const EMAIL = 'Email';
const EXPECTED_RESULT = 'ExpectedResult';
const FIRST_NAME = 'FirstName';
const LAST_NAME = 'LastName';
const GENDER = 'Gender';
const MEMBER_ID = 'MemberId';
const PHONE_1 = 'HomePhone';
const PHONE_2 = 'MobilePhone';
const PHONE_3 = 'Phone3';
const POSTAL_CODE = 'Postalcode';
const PROVINCE = 'Province';
const TEST_PURPOSE = 'TestPurpose';

export class PlayerIdentityService {
  private checkPlayerStats: JobStats;

  constructor(
    private readonly config: ConfigurationService,
    @InjectRepository(Player)
    private readonly repo: Repository<Player>,
    private readonly externalAPIService: ExternalapiService,
    private readonly nicknameService: NickNameService,
  ) {
    this.checkPlayerStats = new JobStats('checkPlayerStats');
  }

  getCheckPlayerStatus() {
    return this.checkPlayerStats;
  }

  /* This checks that every worksheet in a provided workbook has correct
   * header rows.
   */
  async validateFile(file): Promise<any> {
    this.checkPlayerStats = new JobStats('checkPlayerStats');
    this.checkPlayerStats.setStatus(JobState.IN_PROGRESS);
    this.checkPlayerStats.setCurrentActivity('Validating membership workbook');
    let isValid: boolean = true;
    const expectedHeaders: string[] = [
      MEMBER_ID, CLUB_NUMBER, FIRST_NAME, LAST_NAME, GENDER, BIRTH_DATE,
      ADDRESS, CITY, PROVINCE, POSTAL_CODE, EMAIL,
      PHONE_1, PHONE_2, PHONE_3, TEST_PURPOSE, EXPECTED_RESULT,
    ];
    const membershipWB: Workbook = await XlsxPopulate.fromFileAsync(file.path);
    this.checkPlayerStats.toDo = membershipWB.sheets().length;
    for (const ws of membershipWB.sheets()) {
      let hasMemberId = false;
      let hasClub = false;
      let hasLastName = false;
      let hasFirstName = false;
      const unexpectedHeaders: string[] = [];
      const headers = ws.range(1, 1, 1, ws.row(1).maxUsedColumnNumber());
      for (const cell of headers.cells()[0]) {
        if (MEMBER_ID === cell.value()) hasMemberId = true;
        if (CLUB_NUMBER === cell.value()) hasClub = true;
        if (LAST_NAME === cell.value()) hasLastName = true;
        if (FIRST_NAME === cell.value()) hasFirstName = true;
        if (cell.value() && expectedHeaders.indexOf(cell.value()) < 0) unexpectedHeaders.push(cell.value());
      }

      // make sure the required headers are there
      if (!hasMemberId) {
        this.checkPlayerStats.addNote(ws.name() + ' is missing ' + MEMBER_ID + ' column.');
        isValid = false;
      }
      if (!hasLastName) {
        this.checkPlayerStats.addNote(ws.name() + ' is missing ' + LAST_NAME + ' column.');
        isValid = false;
      }
      if (!hasFirstName) {
        this.checkPlayerStats.addNote(ws.name() + ' is missing ' + FIRST_NAME + ' column.');
        isValid = false;
      }
      if (!hasClub) {
        this.checkPlayerStats.addNote(ws.name() + ' is missing ' + CLUB_NUMBER + ' column.');
        isValid = false;
      }
      if (unexpectedHeaders.length > 0) {
        this.checkPlayerStats.addNote(
          ws.name() + ' has unexpected headers: ' + JSON.stringify(unexpectedHeaders));
        isValid = false;
      }
    }
    if (isValid) {
      // Note - we are deliberately NOT waiting to process the workbook before returning
      // The client can poll for status if they want.
      this.processMembershipWB(membershipWB);
    } else {
      this.checkPlayerStats.addNote('Aborting, input membership book is invalid.');
      this.checkPlayerStats.setStatus(JobState.ERROR);
    }
    return isValid;
  }

  // Make a copy of the original worksheet and for each member (if the match is not perfect)
  // add a list of candidates for that member with color coding for quality of match in each field
  async processMembershipWB(membershipWB: Workbook): Promise<string> {
    const wb = await Workbook.fromBlankAsync();
    this.makeInstructionsWS(wb);
    this.checkPlayerStats.setCurrentActivity('Processing workbook');
    for (const inputWS of membershipWB.sheets()) {
      this.checkPlayerStats.setCurrentActivity('Processing sheet: ' + inputWS.name());
      this.checkPlayerStats.bump('done');
      const ws = wb.addSheet(inputWS.name());

      // copy the headers to the output sheet
      const headerMap = [];
      const numHeaders: number = inputWS.row(1).maxUsedColumnNumber();
      for (let i = 1; i <= numHeaders; i++) {
        this.copyCell(inputWS.cell(1, i), ws.cell(1, i));
        // while we are here, build a map of column numbers to headers
        headerMap[inputWS.cell(1, i).value()] = i;
        if (inputWS.cell(1, i).value() === BIRTH_DATE) {
          ws.column(i).style('numberFormat', 'yyyy-mm-dd');
          ws.column(i).width(12);
        }
        if (inputWS.cell(1, i).value() === GENDER) {
          ws.column(i).width(8);
        }
        if (inputWS.cell(1, i).value() === EMAIL) {
          ws.column(i).width(26);
        }
      }
      this.checkPlayerStats.setCounter('membersToDo', inputWS.usedRange().endCell().row().rowNumber());
      this.checkPlayerStats.setCounter('membersDone', 0);

      // add a column to distinguish candidates from input rows
      ws.cell(1, numHeaders + 1).value(CANDIDATE);
      ws.row(1).style({bold: true});

      let inputRow = 1;
      let outputRow = 1;
      while (true) {
        this.checkPlayerStats.bump('membersDone');
        inputRow++; // skipping th header row which we have already processed
        outputRow++;
        if (inputWS.row(inputRow).maxUsedColumnNumber() < 1) break;
        // Output the input row.
        // At the same time, build an IdentityCheckDTO from the input row.
        const m: IdentityCheckDTO = new IdentityCheckDTO();
        if (headerMap[MEMBER_ID]) {
          m.playerId = inputWS.cell(inputRow, headerMap[MEMBER_ID]).value();
          this.copyCell(inputWS.cell(inputRow, headerMap[MEMBER_ID]), ws.cell(outputRow, headerMap[MEMBER_ID]));
        }

        if (headerMap[LAST_NAME]) {
          m.lastName = inputWS.cell(inputRow, headerMap[LAST_NAME]).value();
          this.copyCell(inputWS.cell(inputRow, headerMap[LAST_NAME]), ws.cell(outputRow, headerMap[LAST_NAME]));
        }

        if (headerMap[FIRST_NAME]) {
          m.firstName = inputWS.cell(inputRow, headerMap[FIRST_NAME]).value();
          this.copyCell(inputWS.cell(inputRow, headerMap[FIRST_NAME]), ws.cell(outputRow, headerMap[FIRST_NAME]));
        }
        if (headerMap[GENDER]) {
          m.gender = inputWS.cell(inputRow, headerMap[GENDER]).value();
          this.copyCell(inputWS.cell(inputRow, headerMap[GENDER]), ws.cell(outputRow, headerMap[GENDER]));
        }
        if (headerMap[BIRTH_DATE]){
          if (!isNaN(inputWS.cell(inputRow, headerMap[BIRTH_DATE]).value())) {
            m.DOB = XlsxPopulate.numberToDate(inputWS.cell(inputRow, headerMap[BIRTH_DATE]).value());
            ws.cell(outputRow, headerMap[BIRTH_DATE])
              .value(XlsxPopulate.dateToNumber(m.DOB));
          }
        }
        if (headerMap[EMAIL]) {
          const email = inputWS.cell(inputRow, headerMap[EMAIL]).value();
          // make sure the incoming email is a string
          // if it is a mailto: link in the spreadsheet, just ignore it.
          if (typeof email === 'string') {
            m.email = email;
            this.copyCell(inputWS.cell(inputRow, headerMap[EMAIL]), ws.cell(outputRow, headerMap[EMAIL]));
          }
        }
        if (headerMap[POSTAL_CODE]) {
          const postalCode = inputWS.cell(inputRow, headerMap[POSTAL_CODE]).value();
          if (postalCode) {
            if (!isNaN(postalCode)) {
              m.postalCode = postalCode.toString();
            } else  {
              m.postalCode = postalCode;
            }
          }
          this.copyCell(inputWS.cell(inputRow, headerMap[POSTAL_CODE]), ws.cell(outputRow, headerMap[POSTAL_CODE]));
        }
        if (headerMap[PHONE_1]) {
          let phoneNumber = inputWS.cell(inputRow, headerMap[PHONE_1]).value();
          if (phoneNumber) {
            if (typeof phoneNumber === 'string') {
              phoneNumber = Number(phoneNumber.replace(/\D/g, ''));
            }
            if (!isNaN(phoneNumber)) {
              m.phone1 = phoneNumber;
            }
            this.copyCell(inputWS.cell(inputRow, headerMap[PHONE_1]), ws.cell(outputRow, headerMap[PHONE_1]));
          }
        }
        if (headerMap[PHONE_2]) {
          let phoneNumber = inputWS.cell(inputRow, headerMap[PHONE_2]).value();
          if (phoneNumber) {
            if (typeof phoneNumber === 'string') {
              phoneNumber = Number(phoneNumber.replace(/\D/g, ''));
            }
            if (!isNaN(phoneNumber) && (!m.phone1 || m.phone1 !== phoneNumber)) {
              m.phone2 = phoneNumber;
            }
            this.copyCell(inputWS.cell(inputRow, headerMap[PHONE_2]), ws.cell(outputRow, headerMap[PHONE_2]));
          }
        }
        if (headerMap[PHONE_3]) {
          let phoneNumber = inputWS.cell(inputRow, headerMap[PHONE_3]).value();
          if (phoneNumber) {
            if (typeof phoneNumber === 'string') {
              phoneNumber = Number(phoneNumber.replace(/\D/g, ''));
            }
            if (!isNaN(phoneNumber) &&
              (!m.phone1 || m.phone1 !== phoneNumber) &&
              (!m.phone2 || m.phone2 !== phoneNumber)) {
              m.phone3 = phoneNumber;
            }
            this.copyCell(inputWS.cell(inputRow, headerMap[PHONE_3]), ws.cell(outputRow, headerMap[PHONE_3]));
          }
        }
        // We do not use the following fields in the matching process.
        if (headerMap[CLUB_NUMBER]) {
          this.copyCell(inputWS.cell(inputRow, headerMap[CLUB_NUMBER]), ws.cell(outputRow, headerMap[CLUB_NUMBER]));
        }
        if (headerMap[ADDRESS]) {
          this.copyCell(inputWS.cell(inputRow, headerMap[ADDRESS]), ws.cell(outputRow, headerMap[ADDRESS]));
        }
        if (headerMap[CITY]) {
          this.copyCell(inputWS.cell(inputRow, headerMap[CITY]), ws.cell(outputRow, headerMap[CITY]));
        }
        if (headerMap[TEST_PURPOSE]) {
          this.copyCell(inputWS.cell(inputRow, headerMap[TEST_PURPOSE]), ws.cell(outputRow, headerMap[TEST_PURPOSE]));
        }
        if (headerMap[EXPECTED_RESULT]) {
          this.copyCell(inputWS.cell(inputRow, headerMap[EXPECTED_RESULT]), ws.cell(outputRow, headerMap[EXPECTED_RESULT]));
        }

        // if the player we are checking has a playerId, let's see if we have such a record
        let specialCandidate: PlayerMatchCandidate = null;
        if (m.playerId) {
          const candidatePlayer: Player[] = await this.repo.find({where: {playerId: m.playerId}});
          if (candidatePlayer.length === 1) {
            // If there is a clean match on the member's last name
            // we are going to assume that this is a good match and not bother looking for
            // any more match candidates.
            specialCandidate = await this.matchPlayerToACandidate(m, candidatePlayer[0]);
            specialCandidate.lastName = this.matchLastName(m, candidatePlayer[0]);
            if (specialCandidate.lastName.code >= MatchCode.EFFECTIVE_MATCH) {
              ws.cell(outputRow, headerMap[MEMBER_ID]).style('fill', 'e2f2d5');
              continue;  // No need to go further, there is a match.
            } else {
              ws.cell(outputRow, headerMap[MEMBER_ID]).style('fill', 'f28787');
            }
          }
        }

        const candidates: PlayerMatchCandidate[] = await this.identityCheck(m);
        if (specialCandidate) candidates.unshift(specialCandidate);
        // if the top candidate is good, stick the memberId in the MemberID column
        // and color it purple.
        if (candidates.length > 0  &&
          candidates[0].score > 60) {
          ws.cell(outputRow, headerMap[MEMBER_ID]).value(candidates[0].playerId.matchNote);
          ws.cell(outputRow, headerMap[MEMBER_ID]).style('fill', 'e9d7ef');
        }
        for (const candidate of candidates) {
          outputRow++;
          ws.row(outputRow).style({fontSize: 8});
          if (headerMap[MEMBER_ID]) {
            candidate.playerId.toCell(ws.cell(outputRow, headerMap[MEMBER_ID]));
          }
          if (headerMap[LAST_NAME]) {
            candidate.lastName.toCell(ws.cell(outputRow, headerMap[LAST_NAME]));
          }

          if (headerMap[FIRST_NAME]) {
            candidate.firstName.toCell(ws.cell(outputRow, headerMap[FIRST_NAME]));
          }
          if (headerMap[GENDER]) {
            candidate.gender.toCell(ws.cell(outputRow, headerMap[GENDER]));
          }
          if (headerMap[BIRTH_DATE]){
            candidate.DOB.toCell(ws.cell(outputRow, headerMap[BIRTH_DATE]));
          }
          if (headerMap[EMAIL]) {
            candidate.email.toCell(ws.cell(outputRow, headerMap[EMAIL]));
          }
          if (headerMap[POSTAL_CODE]) {
            candidate.postalCode.toCell(ws.cell(outputRow, headerMap[POSTAL_CODE]));
          }
          if (headerMap[PHONE_1]) {
            candidate.phone1.toCell(ws.cell(outputRow, headerMap[PHONE_1]));
          }
          if (headerMap[PHONE_2]) {
            candidate.phone2.toCell(ws.cell(outputRow, headerMap[PHONE_2]));
          }
          if (headerMap[PHONE_3]) {
            candidate.phone3.toCell(ws.cell(outputRow, headerMap[PHONE_3]));
          }
          ws.cell(outputRow, numHeaders + 1).value(candidate.score);
        }
      }
    }

    // Delete the "Sheet1" that gets created automatically.
    if (wb.sheets().length > 0) wb.deleteSheet(0);

    const now = moment().format('YYYY-MM-DD-HH-mm-ss');
    const filename = `Reports/MemberCheck${now}.xlsx`;
    await wb.toFileAsync(filename);
    this.checkPlayerStats.setData('filename', filename);
    this.checkPlayerStats.setStatus(JobState.DONE);
    return filename;
  }

  // given a (partial) player record, find the best matches in the database
  async identityCheck(p: IdentityCheckDTO): Promise<PlayerMatchCandidate[]> {
    const candidatePlayers: Player[] = await this.findCandidatePlayers(p);
    const candidates: PlayerMatchCandidate[] = [];

    // process the potential matches one at a time, computing a score
    // for how each candidate matches up.
    for (const c of candidatePlayers) {
      const candidate: PlayerMatchCandidate = await this.matchPlayerToACandidate(p, c);
      if (candidate.score > this.config.candidateMatchScoreThreshold) {
        candidates.push(candidate);
      }
    }
    // sort the candidates based on score
    candidates.sort((a, b) => (a.score > b.score) ? -1 : ((b.score > a.score) ? 1 : 0));

    // Only take the number of candidates we want (as configured)
    // This method of truncation requires no copying.
    candidates.length = Math.min(this.config.howManyCandidateMatches, candidates.length);
    return candidates;
  }

  /*
   * We use two ways to find candidate players to match against the (partial)
   * player record.  1) By id, 2) by last name.
   */
  async findCandidatePlayers(p: IdentityCheckDTO): Promise<Player[]> {
    /*
     * Look up all the players with the same last name and they all
     * become candidates for the a match.
     *
     * When we search the database automatically ignores case.  It also
     * is insensitive to accented characters (thankfully).
     *
     * But we know that spaces, periods, dashes and apostrophes are
     * are also abused.  So in the query we eliminate all of these.
     *
     * "DeAbreu" and "de Abreau" are the same.
     * "St.Pierre" and "St Pierre" and "StPierre" are all the same.
     * "De L'Engle", "delengle", "de lEngle", are all the same.
     *
     * The resulting query is horribly inefficient, but the computer
     * has a big brain and CPU cycles to kill.
     */
    return await this.repo.createQueryBuilder()
      .where('REPLACE(REPLACE(REPLACE(lastName, "-", "")," ",""),"\'","") = ' +
        'REPLACE(REPLACE(REPLACE(:ln, "-","")," ",""),"\'","")', {ln: this.stripSpecialCharacters(p.lastName)})
      .getMany();
  }

  /*
   * do a field by field match between data for a player whose identity we are trying to
   * confirm and data for a player that exists in the database.
   */
  async matchPlayerToACandidate(p: IdentityCheckDTO, c: Player): Promise<PlayerMatchCandidate> {
    const pmc = new PlayerMatchCandidate();
    /* First deal with the special case of being given a playerId
     * A match on player Id is golden, but we should watch for mismatches in other fields
     * particularly last name.
     */
    pmc.playerId = this.matchId(p, c);
    pmc.lastName = new FieldMatch(MatchCode.MATCH, c.lastName, 10);
    pmc.firstName = await this.matchFirstName(p, c);
    pmc.gender = await this.matchGender(p, c);
    pmc.email = this.matchEmail(p, c);
    pmc.DOB = this.matchDOB(p, c);
    pmc.phone1 = this.matchPhoneNumbers(p, c, 1);
    pmc.phone2 = this.matchPhoneNumbers(p, c, 2);
    pmc.phone3 = this.matchPhoneNumbers(p, c, 3);
    pmc.postalCode = await this.matchPostalCode(p, c);
    // partial address matching works but is too slow.
    // pmc.address = await this.matchAddress(p, c);
    pmc.score = pmc.playerId.score + pmc.lastName.score + pmc.firstName.score + pmc.gender.score +
      pmc.email.score + pmc.DOB.score + pmc.postalCode.score  +
      pmc.phone1.score + pmc.phone2.score  + pmc.phone3.score ;
    this.checkPlayerStats.bump('candidates checked');
    return pmc;
  }

  matchId(p: IdentityCheckDTO, c: Player): FieldMatch {
    if (!p.playerId) return new FieldMatch(MatchCode.NO_MATCH, c.playerId.toString(), 0);
    if (p.playerId === c.playerId.toString())
      return new FieldMatch(MatchCode.MATCH, c.playerId.toString(), 100);
    return new FieldMatch(MatchCode.MISMATCH, c.playerId.toString(), -50);
  }

  // a match on last name is only done if the candidate was looked up by ID
  // this matching will fail on mismatch of accented characters
  matchLastName(p: IdentityCheckDTO, c: Player): FieldMatch | null {
    if (!p.lastName || !c.lastName) return new FieldMatch(MatchCode.NO_MATCH, 'No match', -50);

    // look for a perfect match
    if (p.lastName === c.lastName) return new FieldMatch(MatchCode.MATCH, c.lastName, 10);

    // Look for a match minus white space and special characters and
    // accent independent
    if (this.accentFold(this.stripSpecialCharacters(p.lastName.toLowerCase())) ===
      this.accentFold(this.stripSpecialCharacters(c.lastName.toLowerCase()))) {
      return new FieldMatch(MatchCode.EFFECTIVE_MATCH, c.lastName, 10);
    }

    // Give up
    return new FieldMatch(MatchCode.MISMATCH, c.lastName, -100);
  }

  /* Match two first names and take into account variations of the name
   * Theodore/Theodore is a match
   * Theodore/Teddy is a probable match
   * A match on first name is good, and a mismatch is significant.
   */
  async matchFirstName(p: IdentityCheckDTO, c: Player): Promise<FieldMatch> {
    if (!p.firstName || !c.firstName) return new FieldMatch(MatchCode.NO_MATCH, 'No match', -5);
    // Be pessimistic
    const n1: string = p.firstName.toLowerCase();
    const n2: string = c.firstName.toLowerCase();

    // Look for perfect match
    if (n1 === n2) return new FieldMatch(MatchCode.MATCH, c.firstName, 20);

    // try accent insensitive match after removing special characters
    if (this.accentFold(this.stripSpecialCharacters(n1.toLowerCase())) ===
      this.accentFold(this.stripSpecialCharacters(n2.toLowerCase())))
      return new FieldMatch(MatchCode.EFFECTIVE_MATCH, c.firstName, 20);

    if (await this.nicknameService.isNickName(n1, n2)) {
      return new FieldMatch(MatchCode.PROBABLE_MATCH,
        'nickname: ' + n1 + ' <-> ' + n2, 15);
    }
    return new FieldMatch(MatchCode.MISMATCH,  c.firstName, -5);
  }

  // A match on a email is quite good, but it could be a parent
  // a mismatch is not really that important.
  matchEmail(p: IdentityCheckDTO, c: Player): FieldMatch {
    if (!p.email || !c.email) return new FieldMatch(MatchCode.NO_MATCH, 'No match', 0);
    if (p.email.toLowerCase() === c.email.toLowerCase()) {
      return new FieldMatch(MatchCode.MATCH, c.email, 20);
    } else {
      return new FieldMatch(MatchCode.MISMATCH, c.email, -5);
    }
  }

  // Assuming for now that both dates start with YYYY-MM-DD
  // A match on DOB name is very good, and a mismatch is quite significant.
  matchDOB(p: IdentityCheckDTO, c: Player): FieldMatch {
    if (!p.DOB || !c.DOB) return new FieldMatch(MatchCode.NO_MATCH, 'No Match', -5);
    // new Date('1959-10-06') gives "Mon Oct 05 1959 16:00:00 GMT-0800 (Pacific Daylight Time)"
    // new Date('1959/10/06') gives "Tue Oct 06 1959 00:00:00 GMT-0800 (Pacific Daylight Time)"
    // so I'm changing the "-" to "/". Soooo sorry
    const cDOB = new Date(c.DOB.replace(/-/gi, '\/'));
    if (p.DOB.getFullYear() === cDOB.getFullYear() &&
      p.DOB.getMonth() === cDOB.getMonth() &&
      p.DOB.getDate() === cDOB.getDate()) {
      return new FieldMatch(MatchCode.MATCH, XlsxPopulate.dateToNumber(cDOB), 40);
    } else if (p.DOB.getFullYear() === cDOB.getFullYear() &&
      p.DOB.getMonth() === cDOB.getMonth() &&
      Math.abs(p.DOB.getDate() - cDOB.getDate()) === 1 ) {
      return new FieldMatch(MatchCode.POSSIBLE_MATCH, 'out by exactly 1 day', -10);
    } else if (Math.abs(p.DOB.getFullYear() - cDOB.getFullYear()) === 1 &&
      p.DOB.getMonth() === cDOB.getMonth() &&
      p.DOB.getDate() === cDOB.getDate()) {
      return new FieldMatch(MatchCode.POSSIBLE_MATCH, 'out by exactly 1 year', -10);
    }
    return new FieldMatch(MatchCode.MISMATCH, XlsxPopulate.dateToNumber(cDOB), -30);
  }

  matchPhoneNumbers(p: IdentityCheckDTO, c: Player, whichPhone): FieldMatch {
    let phone: number;
    if (whichPhone === 1 && p.phone1) phone = p.phone1;
    if (whichPhone === 2 && p.phone2) phone = p.phone2;
    if (whichPhone === 3 && p.phone3) phone = p.phone3;
    if (!phone) return new FieldMatch(MatchCode.NO_MATCH, 'No matches', 0);
    if (c.phone && Number(c.phone) === phone)
      return new FieldMatch(MatchCode.MATCH, c.phone, 10);
    if (c.phone2 && Number(c.phone2) === phone)
      return new FieldMatch(MatchCode.MATCH, c.phone2, 10);
    if (c.phone && Number(c.mobile) === phone)
      return new FieldMatch(MatchCode.MATCH, c.mobile, 10);
    return new FieldMatch(MatchCode.MISMATCH, 'Mismatch', -5);
  }

  // M, m, Male, male, W, w, Woman, woman, female, Female.
  /* A match on gender name is good, and a mismatch is quite significant. */
  matchGender(p: IdentityCheckDTO, c: Player): FieldMatch {
    if (!p.gender || !c.gender) return new FieldMatch(MatchCode.NO_MATCH, 'No Match', -5);
    if (p.gender.toLowerCase() === c.gender.toLowerCase()) {
      return new FieldMatch(MatchCode.MATCH, c.gender, 10);
    }
    let pg = p.gender.substr(0, 1).toLowerCase();
    if (pg === 'w') pg = 'f';
    if (pg === c.gender.toLowerCase()) {
      return new FieldMatch(MatchCode.EFFECTIVE_MATCH, c.gender, 10);
    }

    // Give up
    return new FieldMatch(MatchCode.MISMATCH, c.gender, -10);
  }

  /* A match on postal code is good, mismatch is not that important */
  matchPostalCode(p: IdentityCheckDTO, c: Player): FieldMatch {
    if (!p.postalCode || !c.postalCode) return new FieldMatch(MatchCode.NO_MATCH, 'No Match', 0);
    if (this.stripSpecialCharacters(p.postalCode.toLowerCase()) === this.stripSpecialCharacters(c.postalCode.toLowerCase())) {
      return new FieldMatch(MatchCode.MATCH, c.postalCode, 8);
    }

    // Give up
    return new FieldMatch(MatchCode.MISMATCH, c.postalCode, -1);
  }

  stripSpecialCharacters(s: string): string {
    return s.replace(/[\-\'\s]/g, '');
  }

  accentMap = {
    á: 'a', â: 'a', à: 'a',
    é: 'e', ê: 'E', è: 'e',
    ì: 'i', í: 'i', î: 'i',
    Ò: 'o', Ó: 'o', Ô: 'o',
    ú: 'u', ù: 'u', û: 'u',
  };

  accentFold(s) {
    if (!s) { return ''; }
    let ret = '';
    for (let i = 0; i < s.length; i++) {
      ret += this.accentMap[s.charAt(i)] || s.charAt(i);
    }
    return ret;
  }

  copyCell(i: Cell, o: Cell) {
    o.value(i.value());
  }

  makeInstructionsWS(wb: Workbook) {
    const ws: Sheet = wb.addSheet('Instructions');
    const instructions: string[][] = [
      ['This workbook is a reflection of the membership list workbook you provided.'],
      [],
      ['If you provided a member with a membership ID, we merely confirm that there exists such a member with the same last name as you provided.'],
      [],
      ['If you gave us some membership data, then no matter how sketchy that data is, we try to find a list of'],
      ['candidates who might fit the data you gave.'],
      [],
      ['For every member on an input sheet, we'],
      ['1',	'colour the membership number green if we can confirm it.'],
      ['2',	'otherwise we provide a ranked list of candidates that fit the member data you provided'],
      ['3',	'If any candidate is deemed to be a good match, we propose its membership id to complete your data, and color it purple'],
      ['4',	'for each candidate'],
      ['', '4a',	'we color code the fields showing how each matches the data you provided'],
      ['', '4b',	'we provide a score for the quality of the overall match between your data and the candidate'],
      [],
      ['You need to do a few things now.  Go sheet by sheet through this book'],
      ['1',	'if any memberIds are red, something is wrong and you need to look into it'],
      ['', 'Generally this means that a member is using someone else\'s id	'],
      ['', 'There may be an obvious candidate in which case you can copy it\'s id onto the member\'s line.'],
      ['2',	'You should check any proposed membership Id (purple) - the match should be quite clear'],
      ['3',	'If a player has no membership ID proposed, look at the candidates, there might be an obvious choice'],
      ['4',	'You may want to check VR for a membership ID for the player'],
      ['5',	'You may need to create a new membership ID for the player in VR'],
      ['6',	'Once you have filled in all the membership Ids you can, delete all the candidates from the sheet'],
      ['', '6a',	'turn on filtering'],
      ['', '6b',	'filter for non blanks in the Candidates column'],
      ['', '6c',	'delete all those rows'],
      ['7',	'Important! You need to tell the club about any incorrect members, member Ids that were found or memberIds that were created'],
      ['Otherwise you will have to do the same work next year.'],
      [],
      ['Now you have a bunch of nice clean membership lists with good membership numbers'],
      ['1',	'Get the workbook to Ted to do the actual renewals in VR.'],
    ];
    for (let r = 0; r < instructions.length; r++) {
      for (let c = 0; c < instructions[r].length ; c++) {
        ws.cell(r + 1, c + 1).value(instructions[r][c]);
      }
    }
  }
}
