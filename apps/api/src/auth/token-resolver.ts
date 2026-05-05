export type UserIdLookup = (token: string) => string | undefined | Promise<string | undefined>;

export class TokenResolver {
  static async resolveUserIdByToken(token: string, lookupUserIdByToken: UserIdLookup) {
    return await lookupUserIdByToken(token);
  }
}

