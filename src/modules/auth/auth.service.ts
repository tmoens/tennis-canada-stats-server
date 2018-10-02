import {Injectable} from '@nestjs/common';

const OktaJwtVerifier = require('@okta/jwt-verifier');

const authConfig = require('../../../auth.config.json');

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: authConfig.resourceServer.oidc.issuer,
  assertClaims: authConfig.resourceServer.assertClaims
});

@Injectable()
export class AuthService {
  constructor() {}

  async validateUser(token: string): Promise<any> {
    // Validate if token passed along with HTTP request
    // is associated with any registered account in the database
    return await oktaJwtVerifier.verifyAccessToken(token);
  }
}