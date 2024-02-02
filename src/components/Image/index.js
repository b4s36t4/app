import lodashGet from 'lodash/get';
import React, {useCallback, useMemo, useState} from 'react';
import {withOnyx} from 'react-native-onyx';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import BaseImage from './BaseImage';
import {defaultProps, imagePropTypes} from './imagePropTypes';
import RESIZE_MODES from './resizeModes';

function Image({source: propsSource, isAuthTokenRequired, session, onLoad, style, objectPositionTop, ...forwardedProps}) {
    const [aspectRatio, setAspectRatio] = useState(null);

    // Update the source to include the auth token if required
    const source = useMemo(() => {
        if (typeof lodashGet(propsSource, 'uri') === 'number') {
            return propsSource.uri;
        }
        if (typeof propsSource !== 'number' && isAuthTokenRequired) {
            const authToken = lodashGet(session, 'encryptedAuthToken');
            return {
                ...propsSource,
                headers: {
                    [CONST.CHAT_ATTACHMENT_TOKEN_KEY]: authToken,
                },
            };
        }

        return propsSource;
        // The session prop is not required, as it causes the image to reload whenever the session changes. For more information, please refer to issue #26034.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propsSource, isAuthTokenRequired]);

    const imageLoadedSuccessfully = useCallback(
        (event) => {
            const {width, height} = event.nativeEvent;

            onLoad(event);

            if (objectPositionTop) {
                if (width > height) {
                    setAspectRatio(1);
                    return;
                }
                setAspectRatio(height ? width / height : 'auto');
            }
        },
        [onLoad, objectPositionTop],
    );

    return (
        <BaseImage
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...forwardedProps}
            source={source}
            onLoad={imageLoadedSuccessfully}
            style={[style, aspectRatio && {aspectRatio, height: 'auto'}, objectPositionTop && !aspectRatio && {opacity: 0}]}
        />
    );
}

function imagePropsAreEqual(prevProps, nextProps) {
    return prevProps.source === nextProps.source;
}

Image.propTypes = imagePropTypes;
Image.defaultProps = defaultProps;

const ImageWithOnyx = React.memo(
    withOnyx({
        session: {
            key: ONYXKEYS.SESSION,
        },
    })(Image),
    imagePropsAreEqual,
);
ImageWithOnyx.resizeMode = RESIZE_MODES;

export default ImageWithOnyx;
