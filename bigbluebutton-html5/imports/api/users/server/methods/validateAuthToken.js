import { Meteor } from 'meteor/meteor';
import RedisPubSub from '/imports/startup/server/redis';
import Logger from '/imports/startup/server/logger';
import upsertValidationState from '/imports/api/auth-token-validation/server/modifiers/upsertValidationState';
import { ValidationStates } from '/imports/api/auth-token-validation';
import pendingAuthenticationsStore from '../store/pendingAuthentications';

export default function validateAuthToken(meetingId, requesterUserId, requesterToken, externalId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ValidateAuthTokenReqMsg';

  Logger.debug('ValidateAuthToken method called', { meetingId, requesterUserId, requesterToken, externalId });

  if (!meetingId) return false;

  // Store reference of methodInvocationObject ( to postpone the connection userId definition )
  pendingAuthenticationsStore.add(meetingId, requesterUserId, requesterToken, this);
  upsertValidationState(meetingId, requesterUserId, ValidationStates.VALIDATING, this.connection.id);

  const payload = {
    userId: requesterUserId,
    authToken: requesterToken,
  };

  Logger.info(`User '${requesterUserId}' is trying to validate auth token for meeting '${meetingId}' from connection '${this.connection.id}'`);

  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
