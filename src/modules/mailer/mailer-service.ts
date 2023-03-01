import {Injectable} from '@nestjs/common';
import {MailerService} from '@nestjs-modules/mailer';
import {User} from '../user/user.entity';
import {getLogger, Logger} from 'log4js';

const logger: Logger = getLogger('TCMailer');
@Injectable()
export class TCMailerService {
  constructor(
    private readonly mailerService: MailerService,
  ) {
  }

  public example(): void {
    this
      .mailerService
      .sendMail({
        to: 'ted.moens@gmail.com', // list of receivers
        subject: 'Testing Nest MailerModule ✔', // Subject line
        text: 'welcome smelcome', // plaintext body
        html: '<b>welcome to fiddlefaddle</b>', // HTML body content
      })
      .then(() => {
        logger.info(`Test message sent to ted`);
      })
      .catch((error) => {
        logger.error(`Failed to send a test message ted` +  + JSON.stringify(error, null, 2));
      });
  }

  public passwordReset(user: User, newPassword: string): void {
    this
      .mailerService
      .sendMail({
        to: user.email,
        subject: 'TC Stats Password Reset', // Subject line
        html: `<p>Greetings ${user.name}: <\p>
          <p>As requested, your password has been changed.  Your new password is
          <b>${newPassword}</b>. Use it to log in, and then to change your password to whatever you like.
          <p></p>
          <p>Sorry about the source of this email, but it is the only email server I had available
          for automatic e-mail sending.</p>
          <p></p>
          <p>Ted</p>`
      })
      .then(() => {
        logger.info(`Password reset message sent to ${user.username}`);
      })
      .catch((error) => {
        logger.error(`Failed to send a password reset message to ${user.username}` + JSON.stringify(error, null, 2));
      });
  }

  public newUser(user: User, newPassword: string): void {
    this
      .mailerService
      .sendMail({
        to: user.email,
        subject: 'Welcome to Tennis Canada Stats Tools', // Subject line
        html: `<p>Greetings ${user.name}: <\p>
          <p>Welcome to the Tennis Canada Statistics Tools Site.
          <p>Login here: https://statsadmin.tenniscanada.com/</p>
          <p>Your new user id is <b>${user.username}</b></p>
          <p>Your new password is:
          <b>${newPassword}</b>. You will be required to change it when you log in.
          <p></p>
          <p>Sorry about the source of this email, but it is the only email server I had available
          for automatic e-mail sending.</p>
          <p></p>
          <p>Ted</p>`
      })
      .then(() => {
        logger.info(`Welcome new user message sent to ${user.username}`);
      })
      .catch((error) => {
        logger.error(`Failed to send a welcome new user message to ${user.username}` + JSON.stringify(error, null, 2));
      });
  }
}
