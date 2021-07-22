import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import deviceInfo from '/imports/utils/deviceInfo';
import Settings from '/imports/ui/services/settings';
import WebcamDraggable from './webcam-draggable-overlay/component';
import { styles } from './styles';
import Storage from '../../services/storage/session';

const { isMobile } = deviceInfo;

const propTypes = {
  children: PropTypes.element.isRequired,
  usersVideo: PropTypes.arrayOf(Array),
  singleWebcam: PropTypes.bool.isRequired,
  hideOverlay: PropTypes.bool,
  swapLayout: PropTypes.bool,
  disableVideo: PropTypes.bool,
  audioModalIsOpen: PropTypes.bool,
  layoutContextState: PropTypes.instanceOf(Object).isRequired,
};

const defaultProps = {
  usersVideo: [],
  hideOverlay: true,
  swapLayout: false,
  disableVideo: false,
  audioModalIsOpen: false,
};


export default class Media extends Component {
  constructor(props) {
    super(props);
    this.refContainer = React.createRef();
    //this.state = { windowWidth: window.innerWidth, windowHeight: window.innerHeight };
  }

  // componentDidMount(){
  //   window.addEventListener('resize', this.handleResize);
  // }

  // componentWillUnmount(){
  //   window.removeEventListener('resize', this.handleResize);
  // }

  // handleResize(e){
  //   this.setState({windowWidth: window.innerWidth, windowHeight: window.innerHeight });
  // }

  render() {
    const {
      swapLayout,
      singleWebcam,
      hideOverlay,
      disableVideo,
      children,
      audioModalIsOpen,
      usersVideo,
      layoutContextState,
      isMeteorConnected,
    } = this.props;

    const { webcamsPlacement: placement } = layoutContextState;
    const placementStorage = Storage.getItem('webcamsPlacement');
    const webcamsPlacement = placement || placementStorage;

    const {
      width: mediaWidth,
      height: mediaHeight,
    } = layoutContextState.mediaBounds;

    const contentClassName = cx({
      [styles.content]: true,
    });

    const overlayClassName = cx({
      [styles.overlay]: true,
      [styles.hideOverlay]: hideOverlay,
      [styles.floatingOverlay]: (webcamsPlacement === 'floating'),
    });

    const containerClassName = cx({
      [styles.container]: true,
      [styles.containerV]: webcamsPlacement === 'top' || webcamsPlacement === 'bottom' || webcamsPlacement === 'floating',
      [styles.containerH]: webcamsPlacement === 'left' || webcamsPlacement === 'right',
    });
    
    const { viewParticipantsWebcams } = Settings.dataSaving;
    const showVideo = usersVideo.length > 0 && viewParticipantsWebcams && isMeteorConnected;
    const fullHeight = !showVideo || (webcamsPlacement === 'floating');

    const isWidthGreater = window.innerWidth > window.innerHeight;
    const mobileFlexDirection = isWidthGreater ? 'row' : 'column';
    return (
      <div
        id="container"
        className={containerClassName}
        ref={this.refContainer}
        style={{flexDirection: isMobile ? mobileFlexDirection : ''}}
      >
        <div
          className={!swapLayout ? contentClassName : overlayClassName}
          style={{
            maxHeight: usersVideo.length > 0
            && ( webcamsPlacement !== 'left' || webcamsPlacement !== 'right' )
            && ( webcamsPlacement === 'top' || webcamsPlacement === 'bottom' )
              ? '80%'
              : '100%',
            minHeight: isMobile && isWidthGreater ? '50%' : '20%',
            maxWidth: usersVideo.length > 0
            && (
              webcamsPlacement !== 'top'
              || webcamsPlacement !== 'bottom'
            )
            && (
              webcamsPlacement === 'left'
              || webcamsPlacement === 'right'
            )
              ? '80%'
              : '100%',
            minWidth: '20%',
          }}
        >
          {children}
        </div>
        {showVideo ? (
          <WebcamDraggable
            refMediaContainer={this.refContainer}
            swapLayout={swapLayout}
            singleWebcam={singleWebcam}
            usersVideoLenght={usersVideo.length}
            hideOverlay={hideOverlay}
            disableVideo={disableVideo}
            audioModalIsOpen={audioModalIsOpen}
            usersVideo={usersVideo}
          />
        ) : null}
      </div>
    );
  }
}

Media.propTypes = propTypes;
Media.defaultProps = defaultProps;
