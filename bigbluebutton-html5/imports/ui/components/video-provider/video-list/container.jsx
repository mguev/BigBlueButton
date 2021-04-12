import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import VideoList from '/imports/ui/components/video-provider/video-list/component';
import VideoService from '/imports/ui/components/video-provider/service';

import Auth from '/imports/ui/services/auth';
import VoiceUsers from '/imports/api/voice-users';
import SettingsService from '/imports/ui/services/settings';

import {
  isVideoBroadcasting,
}
  from '/imports/ui/components/screenshare/service';

const VideoListContainer = ({ children, ...props }) => {
  const { streams } = props;
  return (!streams.length ? null : <VideoList{...props}>{children}</VideoList>);
};

const sortByStartTime = (a, b) => {
  if (a.startTime < b.startTime) return -1;
  if (a.startTime > b.startTime) return 1;
  return 0;
};

const sortVoiceUsers = (a, b) => {
  const sort = sortByStartTime(a, b);
  return sort;
};

export default withTracker(props => {

  const meetingId = Auth.meetingID;
  const usersTalking = VoiceUsers.find({ meetingId, joined: true, spoke: true, talking: true }, {
    fields: {
      // callerName: 1,
      // talking: 1,
      // color: 1,
      // startTime: 1,
      // voiceUserId: 1,
      // muted: 1,
      intId: 1,
    },
  }).fetch().sort(sortVoiceUsers);

  if (usersTalking.length) {
    const {
      // callerName, talking, color, voiceUserId, muted, intId,
      intId
    } = usersTalking[0];
    // talker = {
    //   intId,
    //   color,
    //   talking,
    //   voiceUserId,
    //   muted,
    //   callerName,
    // };
    talker = intId;
  } else {
    talker = false;
  }
  const {
    streams,
    totalNumberOfStreams
  } = VideoService.getVideoStreams(talker);

  // const {
    // streams
  // } = VideoService.getVideoStreams(false);
      
  console.log('video list container updated'); 
  return {
    // talker: props.talker,
    talker,
    paginationEnabled: SettingsService.application.paginationEnabled,
    isScreenSharing: isVideoBroadcasting,
    // streams: props.streams,
    streams,
    totalNumberOfStreams,
    currentVideoPageIndex: props.currentVideoPageIndex,
    onVideoItemMount: props.onVideoItemMount,
    onVideoItemUnmount: props.onVideoItemUnmount,
    swapLayout: props.swapLayout,
    numberOfPages: VideoService.getNumberOfPages(),
    currentVideoPageIndex: props.currentVideoPageIndex,
  }

})(VideoListContainer);
