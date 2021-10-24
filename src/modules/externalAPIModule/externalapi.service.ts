import {Injectable} from '@nestjs/common';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {HttpService} from '@nestjs/axios';

@Injectable()
export class ExternalapiService {
  private nickNameURL = 'http://api.friendlyrobot.fr/v1/nicknames/';
  constructor(
    private http: HttpService,
  ) { }

  fetchNickNames(name: string): Observable<any> {
    return this.http.get(this.nickNameURL + name)
      .pipe(
        map(response => response.data),
        catchError(this.handleError('fetch nickname from ' + this.nickNameURL, null)),
      );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  /*
   * This generic handler was copied from the Angular tutorial.
   * And as a note to future, even thicker, self who will be going WTF?...
   * We use it to handle errors for all our http calls.  But all
   * our HTTP Calls return different types!  And the error handler
   * has to return the right type.  So, the error handler is
   * parameterized such that you can tell it what to return when
   * it is finished doing it's business.
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      return of(result as T);
    };
  }

}
