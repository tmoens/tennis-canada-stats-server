/**
 * These are the "roles" supported by the system.
 *
 * The BC Membership role is defunct.  It used to be used for an application that
 * would allow BC_MEMBERSHIP_ROLE admin to check their club membership lists against
 * the known VR Members.
 */
export const GUEST_ROLE = 'guest';
export const USER_ROLE = 'user';
export const ADMIN_ROLE = 'admin';

export class Roles {
  private static _roles: { [name: string]: number } = {
    'admin': 4,
    'user': 3,
    'guest': 1,
  }

  static isAuthorized(userRole: string, permittedRole: string): boolean {
    return (this._roles[userRole] >= this._roles[permittedRole]);
  }
}
