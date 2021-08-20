import React, { memo } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Button from '/imports/ui/components/button/component';
import VideoService from '../service';
import { defineMessages, injectIntl } from 'react-intl';
import { styles } from './styles';
import { validIOSVersion } from '/imports/ui/components/app/service';
import { debounce } from 'lodash';
import deviceInfo from '/imports/utils/deviceInfo';

const { isMobile } = deviceInfo;

const intlMessages = defineMessages({
  joinVideo: {
    id: 'app.video.joinVideo',
    description: 'Join video button label',
  },
  leaveVideo: {
    id: 'app.video.leaveVideo',
    description: 'Leave video button label',
  },
  videoLocked: {
    id: 'app.video.videoLocked',
    description: 'video disabled label',
  },
  videoConnecting: {
    id: 'app.video.connecting',
    description: 'video connecting label',
  },
  dataSaving: {
    id: 'app.video.dataSaving',
    description: 'video data saving label',
  },
  meteorDisconnected: {
    id: 'app.video.clientDisconnected',
    description: 'Meteor disconnected label',
  },
  iOSWarning: {
    id: 'app.iOSWarning.label',
    description: 'message indicating to upgrade ios version',
  },
});

const JOIN_VIDEO_DELAY_MILLISECONDS = 500;

const propTypes = {
  intl: PropTypes.object.isRequired,
  hasVideoStream: PropTypes.bool.isRequired,
  mountVideoPreview: PropTypes.func.isRequired,
};

const JoinVideoButton = ({
  intl,
  disableReason,
  mountVideoPreview,
}) => {
  const exitVideo = () => VideoService.hasVideoStream() && !VideoService.isMultipleCamerasEnabled();

  const handleOnClick = debounce(() => {
    if (!validIOSVersion()) {
      return VideoService.notify(intl.formatMessage(intlMessages.iOSWarning));
    }

    if (exitVideo()) {
      VideoService.exitVideo();
    } else {
      mountVideoPreview();
    }
  }, JOIN_VIDEO_DELAY_MILLISECONDS);

  let label = exitVideo()
    ? intl.formatMessage(intlMessages.leaveVideo)
    : intl.formatMessage(intlMessages.joinVideo);

  if (disableReason) label = intl.formatMessage(intlMessages[disableReason]);

  return (
    <Button
      label={label}
      data-test={VideoService.hasVideoStream() ? 'leaveVideo' : 'joinVideo'}
      className={cx(VideoService.hasVideoStream() || styles.btn)}
      onClick={handleOnClick}
      hideLabel
      color={VideoService.hasVideoStream() ? 'primary' : 'default'}
      icon={VideoService.hasVideoStream() ? 'video' : 'video_off'}
      ghost={!VideoService.hasVideoStream()}
      ghost
      size={isMobile ? 'md' : 'lg'}
      circle
      disabled={!!disableReason}
    />
  );
};

JoinVideoButton.propTypes = propTypes;

export default injectIntl(memo(JoinVideoButton));
