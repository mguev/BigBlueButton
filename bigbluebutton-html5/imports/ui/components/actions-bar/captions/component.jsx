import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { defineMessages, injectIntl } from 'react-intl';
import { styles } from '/imports/ui/components/actions-bar/styles';
import Button from '/imports/ui/components/button/component';
import deviceInfo from '/imports/utils/deviceInfo';

const { isMobile } = deviceInfo;

const propTypes = {
  intl: PropTypes.object.isRequired,
  isActive: PropTypes.bool.isRequired,
  handleOnClick: PropTypes.func.isRequired,
};

const intlMessages = defineMessages({
  start: {
    id: 'app.actionsBar.captions.start',
    description: 'Start closed captions option',
  },
  stop: {
    id: 'app.actionsBar.captions.stop',
    description: 'Stop closed captions option',
  },
});

const CaptionsButton = ({ intl, isActive, handleOnClick }) => (
  <Button
    className={cx(isActive || styles.btn)}
    icon="closed_caption"
    label={intl.formatMessage(isActive ? intlMessages.stop : intlMessages.start)}
    color={isActive ? 'primary' : 'default'}
    ghost={!isActive}
    hideLabel
    circle
    size= {isMobile ? "md" : "lg"}
    onClick={handleOnClick}
    id={isActive ? 'stop-captions-button' : 'start-captions-button'}
  />
);

CaptionsButton.propTypes = propTypes;
export default injectIntl(CaptionsButton);
