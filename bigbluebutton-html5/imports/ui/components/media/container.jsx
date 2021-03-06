import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Settings from '/imports/ui/services/settings';
import { defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import { notify } from '/imports/ui/services/notification';
import VideoService from '/imports/ui/components/video-provider/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import { withModalMounter } from '/imports/ui/components/modal/service';
import Media from './component';
import MediaService, { getSwapLayout, shouldEnableSwapLayout } from '/imports/ui/components/media/service';
import PresentationPodsContainer from '../presentation-pod/container';
import ScreenshareContainer from '../screenshare/container';
import DefaultContent from '../presentation/default-content/component';
import ExternalVideoContainer from '../external-video-player/container';
import Storage from '../../services/storage/session';
import { withLayoutConsumer } from '/imports/ui/components/layout/context';
import Auth from '/imports/ui/services/auth';
import breakoutService from '/imports/ui/components/breakout-room/service';
import TalkerVideoContainer from '/imports/ui/components/talker-video/container';



const LAYOUT_CONFIG = Meteor.settings.public.layout;
const KURENTO_CONFIG = Meteor.settings.public.kurento;

const propTypes = {
  isScreensharing: PropTypes.bool.isRequired,
  intl: PropTypes.object.isRequired,
};

const intlMessages = defineMessages({
  screenshareStarted: {
    id: 'app.media.screenshare.start',
    description: 'toast to show when a screenshare has started',
  },
  screenshareEnded: {
    id: 'app.media.screenshare.end',
    description: 'toast to show when a screenshare has ended',
  },
  screenshareNotSupported: {
    id: 'app.media.screenshare.notSupported',
    description: 'Error message for screenshare not supported',
  },
  chromeExtensionError: {
    id: 'app.video.chromeExtensionError',
    description: 'Error message for Chrome Extension not installed',
  },
  chromeExtensionErrorLink: {
    id: 'app.video.chromeExtensionErrorLink',
    description: 'Error message for Chrome Extension not installed',
  },
});

class MediaContainer extends Component {
  componentDidMount() {
    document.addEventListener('installChromeExtension', this.installChromeExtension.bind(this));
    document.addEventListener('screenshareNotSupported', this.screenshareNotSupported.bind(this));
  }

  componentDidUpdate(prevProps) {
    const {
      isScreensharing,
      intl,
    } = this.props;
    const {
      isScreensharing: wasScreenSharing,
    } = prevProps;

    if (isScreensharing !== wasScreenSharing) {
      if (!wasScreenSharing) {
        notify(intl.formatMessage(intlMessages.screenshareStarted), 'info', 'desktop');
      } else {
        notify(intl.formatMessage(intlMessages.screenshareEnded), 'info', 'desktop');
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('installChromeExtension', this.installChromeExtension.bind(this));
    document.removeEventListener('screenshareNotSupported', this.screenshareNotSupported.bind(this));
  }

  installChromeExtension() {
    const { intl } = this.props;

    const CHROME_DEFAULT_EXTENSION_LINK = KURENTO_CONFIG.chromeDefaultExtensionLink;
    const CHROME_CUSTOM_EXTENSION_LINK = KURENTO_CONFIG.chromeExtensionLink;
    const CHROME_EXTENSION_LINK = CHROME_CUSTOM_EXTENSION_LINK === 'LINK' ? CHROME_DEFAULT_EXTENSION_LINK : CHROME_CUSTOM_EXTENSION_LINK;

    const chromeErrorElement = (
      <div>
        {intl.formatMessage(intlMessages.chromeExtensionError)}
        {' '}
        <a href={CHROME_EXTENSION_LINK} target="_blank" rel="noopener noreferrer">
          {intl.formatMessage(intlMessages.chromeExtensionErrorLink)}
        </a>
      </div>
    );
    notify(chromeErrorElement, 'error', 'desktop');
  }

  screenshareNotSupported() {
    const { intl } = this.props;
    notify(intl.formatMessage(intlMessages.screenshareNotSupported), 'error', 'desktop');
  }

  render() {
    return <Media {...this.props} />;
  }
}

let userWasInBreakout = false;

export default withLayoutConsumer(withModalMounter(withTracker(() => {
  const { dataSaving } = Settings;
  const { viewParticipantsWebcams, viewScreenshare } = dataSaving;
  const hidePresentation = getFromUserSettings('bbb_hide_presentation', LAYOUT_CONFIG.hidePresentation);
  const autoSwapLayout = getFromUserSettings('bbb_auto_swap_layout', LAYOUT_CONFIG.autoSwapLayout);
  const { current_presentation: hasPresentation } = MediaService.getPresentationInfo();
  const data = {
    children: <DefaultContent {...{ autoSwapLayout, hidePresentation }} />,
    audioModalIsOpen: Session.get('audioModalIsOpen'),
    isMeteorConnected: Meteor.status().connected,
    mobileTesting: false
  };

  if (MediaService.shouldShowWhiteboard() && !hidePresentation) {
    data.currentPresentation = MediaService.getPresentationInfo();
    data.children = <PresentationPodsContainer />;
  }

  if (MediaService.shouldShowScreenshare() && (viewScreenshare || MediaService.isUserPresenter())) {
    data.children = <ScreenshareContainer />;
  }

  const userIsInBreakout = breakoutService.getBreakoutUserIsIn(Auth.userID);
  let deviceIds = Session.get('deviceIds');

  if (!userIsInBreakout && userWasInBreakout && deviceIds && deviceIds !== '') {
    /* used when re-sharing cameras after leaving a breakout room.
    it is needed in cases where the user has more than one active camera
    so we only share the second camera after the first
    has finished loading (can't share more than one at the same time) */
    const canConnect = Session.get('canConnect');

    deviceIds = deviceIds.split(',');

    if (canConnect) {
      const deviceId = deviceIds.shift();

      Session.set('canConnect', false);
      Session.set('WebcamDeviceId', deviceId);
      Session.set('deviceIds', deviceIds.join(','));

      VideoService.joinVideo(deviceId);
    }
  } else {
    userWasInBreakout = userIsInBreakout;
  }

  console.log('media container update');
  const { streams: usersVideo } = VideoService.getVideoStreams();
  data.usersVideo = usersVideo;

  if (MediaService.shouldShowOverlay() && usersVideo.length && viewParticipantsWebcams) {
    data.floatingOverlay = usersVideo.length < 2;
    data.hideOverlay = usersVideo.length === 0;
  }

  data.singleWebcam = (usersVideo.length < 2);

  data.isScreensharing = MediaService.isVideoBroadcasting();
  const showTalker = usersVideo.length && !MediaService.shouldShowExternalVideo() && !MediaService.shouldShowScreenshare() && VideoService.isPaginationEnabled();

  data.swapLayout = !showTalker && (getSwapLayout() || !hasPresentation) && shouldEnableSwapLayout();
  // data.swapLayout = false;
  data.disableVideo = !viewParticipantsWebcams;

  if (data.swapLayout) {
    data.floatingOverlay = true;
    data.hideOverlay = true;
  }

  if (MediaService.shouldShowExternalVideo()) {
    data.children = (
      <ExternalVideoContainer
        isPresenter={MediaService.isUserPresenter()}
      />
    );
  }

  if (showTalker) {
    // data.children = <VideoProviderContainer swapLayout={data.swapLayout} />
    // const [ref, reflection] = useMirror({ className: "Frame" });
    data.hideOverlay = false;
    // data.children = <div
      // id="talkerVideoContainer"
      // 
    // >
      {/* </div>; */}
    data.children = [<TalkerVideoContainer display={true} swapLayout={data.swapLayout} />]
  }else{
    data.children = [<TalkerVideoContainer display={false} swapLayout={data.swapLayout} />, data.children]

  }

  data.webcamsPlacement = Storage.getItem('webcamsPlacement');

  MediaContainer.propTypes = propTypes;
  return data;
})(injectIntl(MediaContainer))));
