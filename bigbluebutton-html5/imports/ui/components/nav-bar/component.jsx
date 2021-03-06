import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import cx from 'classnames';
import { withModalMounter } from '/imports/ui/components/modal/service';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import { defineMessages, injectIntl } from 'react-intl';
import Icon from '../icon/component';
import { styles } from './styles.scss';
import Button from '/imports/ui/components/button/component';
import RecordingIndicator from './recording-indicator/container';
import TalkingIndicatorContainer from '/imports/ui/components/nav-bar/talking-indicator/container';
import ConnectionStatusButton from '/imports/ui/components/connection-status/button/container';
import ConnectionStatusService from '/imports/ui/components/connection-status/service';
import SettingsDropdownContainer from './settings-dropdown/container';
import LeaveMeetingConfirmationContainer from '/imports/ui/components/leave-meeting-confirmation/container';
import deviceInfo from '/imports/utils/deviceInfo';

const { isMobile } = deviceInfo;

import { makeCall } from '/imports/ui/services/api';

const intlMessages = defineMessages({
  leaveSessionLabel: {
    id: 'app.navBar.settingsDropdown.leaveSessionLabel',
    description: 'Leave session button label',
  },
  toggleUserListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'Toggle button label',
  },
  toggleUserListAria: {
    id: 'app.navBar.toggleUserList.ariaLabel',
    description: 'description of the lists inside the userlist',
  },
  newMessages: {
    id: 'app.navBar.toggleUserList.newMessages',
    description: 'label for toggleUserList btn when showing red notification',
  },
  paginationEnabledLabel: {
    id: 'app.submenu.application.paginationEnabledLabel',
    description: 'enable/disable video pagination',
  },
});

const propTypes = {
  presentationTitle: PropTypes.string,
  hasUnreadMessages: PropTypes.bool,
  shortcuts: PropTypes.string,
};

const defaultProps = {
  presentationTitle: 'Default Room Title',
  hasUnreadMessages: false,
  shortcuts: '',
};

class NavBar extends Component {
  // constructor(props) {
  // this.handleUpdateSettings = props.handleUpdateSettings;
  // }
  static handleToggleUserList() {
    Session.set(
      'openPanel',
      Session.get('openPanel') !== ''
        ? ''
        : 'userlist',
    );
    Session.set('idChatOpen', '');

    window.dispatchEvent(new Event('panelChanged'));
  }

  // handleToggle(key) {
  // const obj = this.state;
  // obj.settings[key] = !this.state.settings[key];
  // 
  // this.setState(obj, () => {
  // this.handleUpdateSettings(this.state.settingsName, this.state.settings);
  // });
  // }
  static leaveSession() {
    // makeCall('userLeftMeeting');
    // we don't check askForFeedbackOnLogout here,
    // it is checked in meeting-ended component
    // Session.set('codeError', '680');
    mountModal(<MeetingEndedComponent code={LOGOUT_CODE} />);
  }

  componentDidMount() {
    const {
      processOutsideToggleRecording,
      connectRecordingObserver,
    } = this.props;

    if (Meteor.settings.public.allowOutsideCommands.toggleRecording
      || getFromUserSettings('bbb_outside_toggle_recording', false)) {
      connectRecordingObserver();
      window.addEventListener('message', processOutsideToggleRecording);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const {
      hasUnreadMessages,
      isExpanded,
      intl,
      shortcuts: TOGGLE_USERLIST_AK,
      mountModal,
      presentationTitle,
      togglePagination,
      amIModerator,
    } = this.props;


    const toggleBtnClasses = {};
    toggleBtnClasses[styles.btn] = true;
    toggleBtnClasses[styles.btnWithNotificationDot] = hasUnreadMessages;

    let ariaLabel = intl.formatMessage(intlMessages.toggleUserListAria);
    ariaLabel += hasUnreadMessages ? (` ${intl.formatMessage(intlMessages.newMessages)}`) : '';

    return (
      <div
        className={styles.navbar}
      >
        <div className={styles.top}>
          {/* {amIModerator
            ? (
              <div className={styles.left}>
                {!isExpanded ? null
                  : <Icon iconName="left_arrow" className={styles.arrowLeft} />
                }
                <Button
                  data-test="userListToggleButton"
                  onClick={NavBar.handleToggleUserList}
                  ghost
                  circle
                  hideLabel
                  data-test={hasUnreadMessages ? 'hasUnreadMessages' : null}
                  label={intl.formatMessage(intlMessages.toggleUserListLabel)}
                  aria-label={ariaLabel}
                  icon="user"
                  className={cx(toggleBtnClasses)}
                  aria-expanded={isExpanded}
                  accessKey={TOGGLE_USERLIST_AK}
                />
                {isExpanded ? null
                  : <Icon iconName="right_arrow" className={styles.arrowRight} />
                }
              </div>
            )
            : null} */}

          <div className={styles.left}>
            <Button
              onClick={() => mountModal(<LeaveMeetingConfirmationContainer />)}
              ghost
              circle
              hideLabel
              label={intl.formatMessage(intlMessages.leaveSessionLabel)}
              aria-label={intl.formatMessage(intlMessages.leaveSessionLabel)}
              icon="logout"
              className={cx(toggleBtnClasses)}
            />
          </div>
          <div className={styles.center}>
            <h1 className={styles.presentationTitle}>{presentationTitle}</h1>

            <RecordingIndicator
              mountModal={mountModal}
              amIModerator={amIModerator}
            />
          </div>
          <div className={styles.right}>
            {/* <Button
              onClick={togglePagination}
              ghost
              circle
              hideLabel
              label={intl.formatMessage(intlMessages.paginationEnabledLabel)}
              aria-label={intl.formatMessage(intlMessages.paginationEnabledLabel)}
              icon="presentation"
              className={cx(toggleBtnClasses)}
            /> */}
            {ConnectionStatusService.isEnabled() ? <ConnectionStatusButton /> : null}
            {!isMobile ? <SettingsDropdownContainer togglePagination={togglePagination} amIModerator={amIModerator} /> : null}
          </div>
        </div>
        <div className={styles.bottom}>
          <TalkingIndicatorContainer amIModerator={amIModerator} />
        </div>
      </div>
    );
  }
}

NavBar.propTypes = propTypes;
NavBar.defaultProps = defaultProps;
export default withShortcutHelper(withModalMounter(injectIntl(NavBar)), 'toggleUserList');
