import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import Auth from '/imports/ui/services/auth';
import Meetings from '/imports/api/meetings';
import ActionsBarService from '/imports/ui/components/actions-bar/service';
import UserListService from '/imports/ui/components/user-list/service';
import WaitingUsersService from '/imports/ui/components/waiting-users/service';
import logger from '/imports/startup/client/logger';
import { defineMessages, injectIntl } from 'react-intl';
import { notify } from '/imports/ui/services/notification';
import UserOptions from './component';
import { unMuteAll, muteAll } from '/imports/ui/services/admin-commands';
import VoiceUsers from '/imports/api/voice-users';
import Service from '../../../service';


const propTypes = {
  users: PropTypes.arrayOf(Object).isRequired,
  setEmojiStatus: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
};

const intlMessages = defineMessages({
  clearStatusMessage: {
    id: 'app.userList.content.participants.options.clearedStatus',
    description: 'Used in toast notification when emojis have been cleared',
  },
});

const meetingMuteDisabledLog = () => logger.info({
  logCode: 'useroptions_unmute_all',
  extraInfo: { logType: 'moderator_action' },
}, 'moderator disabled meeting mute');

const UserOptionsContainer = withTracker((props) => {
  const {
    users,
    setEmojiStatus,
    intl,
  } = props;

  const toggleStatus = () => {
    users.forEach(user => setEmojiStatus(user.userId, 'none'));
    notify(
      intl.formatMessage(intlMessages.clearStatusMessage), 'info', 'clear_status',
    );
  };

  const isMeetingMuteOnStart = () => {
    const { voiceProp } = Meetings.findOne({ meetingId: Auth.meetingID },
      { fields: { 'voiceProp.muteOnStart': 1 } });
    const { muteOnStart } = voiceProp;
    return muteOnStart;
  };

  const getMeetingName = () => {
    const { meetingProp } = Meetings.findOne({ meetingId: Auth.meetingID },
      { fields: { 'meetingProp.name': 1 } });
    const { name } = meetingProp;
    return name;
  };

  return {
    toggleMuteAllUsers: () => {
      // muteAll(); 
      VoiceUsers.find({}).forEach(usr => {
        console.log('hi')
        if (!usr.muted) {
          Service.toggleVoice(usr.intId);
        }
      });
      // UserListService.muteAllUsers(Auth.userID);
      // if (isMeetingMuteOnStart()) {
      //   return meetingMuteDisabledLog();
      // }
      // return logger.info({
      //   logCode: 'useroptions_mute_all',
      //   extraInfo: { logType: 'moderator_action' },
      // }, 'moderator enabled meeting mute, all users muted');
    },
    toggleUnMuteAllUsers: () => {
      VoiceUsers.find({}).forEach(usr => {
        console.log('hi')
        if (usr.muted) {
          Service.toggleVoice(usr.intId);
        }
      });
    },
    toggleMuteAllUsersExceptPresenter: () => {
      UserListService.muteAllExceptPresenter(Auth.userID);
      if (isMeetingMuteOnStart()) {
        return meetingMuteDisabledLog();
      }
      return logger.info({
        logCode: 'useroptions_mute_all_except_presenter',
        extraInfo: { logType: 'moderator_action' },
      }, 'moderator enabled meeting mute, all users muted except presenter');
    },
    toggleStatus,
    isMeetingMuted: isMeetingMuteOnStart(),
    amIModerator: ActionsBarService.amIModerator(),
    getUsersNotAssigned: ActionsBarService.getUsersNotAssigned,
    hasBreakoutRoom: UserListService.hasBreakoutRoom(),
    isBreakoutEnabled: ActionsBarService.isBreakoutEnabled(),
    isBreakoutRecordable: ActionsBarService.isBreakoutRecordable(),
    users: ActionsBarService.users(),
    guestPolicy: WaitingUsersService.getGuestPolicy(),
    isMeteorConnected: Meteor.status().connected,
    meetingName: getMeetingName(),
  };
})(UserOptions);

UserOptionsContainer.propTypes = propTypes;

export default injectIntl(UserOptionsContainer);
