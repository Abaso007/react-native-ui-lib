import React, {Component, ElementRef} from 'react';
import {
  StyleSheet,
  findNodeHandle,
  TouchableWithoutFeedback,
  Animated,
  AccessibilityInfo,
  StyleProp,
  TextStyle,
  TouchableWithoutFeedbackProps,
  LayoutChangeEvent
} from 'react-native';
import {HighlighterOverlayView} from 'uilib-native';
import {Colors, Typography} from '../../style';
import {Constants, asBaseComponent} from '../../commons/new';
import View from '../view';
import Text from '../text';
import Button, {ButtonProps, ButtonSize} from '../button';
import PageControl, {PageControlProps} from '../pageControl';

const defaultOverlayColor = Colors.rgba(Colors.black, 0.82);
const defaultTextColor = Colors.white;
const defaultStrokeColor = Colors.rgba(Colors.white, 0.12);
const defaultStrokeWidth = 12;
const contentViewPadding = 32;
const contentViewRightMargin = Constants.isIOS ? 45 : 46;
const titleBottomMargin = 12;
const messageBottomMargin = 24;
const messageLineHeight = 24;
const defaultButtonLabel = 'Got it';
const contentViewHeight = Constants.isAndroid ? 268 : 282;

export type HighlightFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RectSize = {
  width: number;
  height: number;
};

type Position = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type FeatureHighlightProps = {
  /**
   * Boolean to determine if to present the feature highlight component
   */
  visible: boolean;
  /**
   * Frame of the area to highlight {x, y, width, height}
   */
  highlightFrame?: HighlightFrame;
  /**
   * Callback that extract the ref of the element to be highlighted
   */
  getTarget?: () => any;
  /**
   * Title of the content to be displayed
   */
  title?: string;
  /**
   * Message to be displayed
   */
  message?: string;
  /**
   * Title text style
   */
  titleStyle?: StyleProp<TextStyle>;
  /**
   * Message text style
   */
  messageStyle?: StyleProp<TextStyle>;
  /**
   * Title's max number of lines
   */
  titleNumberOfLines?: number;
  /**
   * Message's max number of lines
   */
  messageNumberOfLines?: number;
  /**
   * Props that will be passed to the dismiss button
   */
  confirmButtonProps?: ButtonProps;
  /**
   * Callback for the background press
   */
  onBackgroundPress?: TouchableWithoutFeedbackProps['onPress'];
  /**
   * Color of the content's background (usually includes alpha for transparency)
   */
  overlayColor?: string;
  /**
   * Color of the content's text
   */
  textColor?: string;
  /**
   * Color of the border around the highlighted element
   */
  borderColor?: string;
  /**
   * Width of the border around the highlighted element
   */
  borderWidth?: number;
  /**
   * Border radius for the border corners around the highlighted element
   */
  borderRadius?: number;
  /**
   * The minimum size of the highlighted component (Android API 21+, and only when passing a ref in 'getTarget')
   */
  minimumRectSize?: RectSize;
  /**
   * The padding of the highlight frame around the highlighted element's frame (only when passing ref in 'getTarget')
   */
  innerPadding?: number;
  /**
   * PageControl component's props
   */
  pageControlProps?: PageControlProps;

  testID?: string;
};

interface State {
  fadeAnim: Animated.Value;
  contentTopPosition?: number;
  node?: number | null;
  getTarget?: () => any;
}

/*eslint-disable*/
/**
 * @description: FeatureHighlight component for feature discovery
 * @notes: 1) FeatureHighlight component must be a direct child of the root view returned in render().; 2) If the element to be highlighted doesn't have a style attribute add 'style={{opacity: 1}}' so the Android OS can detect it.
 * @important: FeatureHighlight uses a native library. You MUST add and link the native library to both iOS and Android projects. For instruction please see
 * @importantLink: https://facebook.github.io/react-native/docs/linking-libraries-ios.html
 * @gif: https://github.com/wix/react-native-ui-lib/blob/master/demo/showcase/FeatureHighlight/FeatureHighlight.gif?raw=true
 * @example: https://github.com/wix/react-native-ui-lib/blob/master/demo/src/screens/componentScreens/FeatureHighlightScreen.tsx
 */
/*eslint-enable*/
class FeatureHighlight extends Component<FeatureHighlightProps, State> {
  static displayName = 'FeatureHighlight';

  contentHeight = contentViewHeight;
  targetPosition?: Position;
  viewRef?: ElementRef<any>;

  constructor(props: FeatureHighlightProps) {
    super(props);

    this.getComponentDimensions = this.getComponentDimensions.bind(this);
    this.setTargetPosition = this.setTargetPosition.bind(this);

    this.state = {
      fadeAnim: new Animated.Value(0), // Initial value for opacity: 0
      contentTopPosition: undefined
    };
  }

  static defaultProps = {
    minimumRectSize: {width: 56, height: 56},
    innerPadding: 10
  };

  componentDidMount() {
    this.setTargetPosition();
  }

  static getDerivedStateFromProps(nextProps: FeatureHighlightProps, prevState: State) {
    if (prevState?.getTarget === nextProps?.getTarget) {
      return null;
    }
    
    const target = nextProps?.getTarget?.();
    const node = FeatureHighlight.findTargetNode(target);
    if (node && node !== prevState?.node) {
      return {getTarget: nextProps?.getTarget, node};
    }
    return null;
  }

  shouldSetTargetPosition = (nextProps: FeatureHighlightProps) => {
    return (
      nextProps.getTarget?.() !== this.props.getTarget?.() ||
      nextProps.title !== this.props.title ||
      nextProps.visible !== this.props.visible
    );
  };

  componentDidUpdate(nextProps: FeatureHighlightProps) {
    if (this.shouldSetTargetPosition(nextProps)) {
      this.setTargetPosition();
    }
    if (this.viewRef) {
      this.setAccessibilityFocus(this.viewRef);
    }
  }

  setAccessibilityFocus(ref: any) {
    const reactTag = findNodeHandle(ref);
    reactTag && AccessibilityInfo.setAccessibilityFocus(reactTag);
  }

  static findTargetNode(target: Component) {
    return findNodeHandle(target);
  }

  animate(toValue: number) {
    Animated.timing(
      // Animate over time
      this.state.fadeAnim, // The animated value to drive
      {
        toValue, // Animate to value
        duration: toValue ? 100 : 0, // Make it take a while
        useNativeDriver: true
      }
    ).start(); // Starts the animation
  }

  setTargetPosition(props = this.props) {
    if (props.getTarget !== undefined) {
      const target = props.getTarget();
      if (target) {
        setTimeout(() => {
          target.measureInWindow((x: number, y: number, width: number, height: number) => {
            this.targetPosition = {left: x, top: y, width, height};
            this.setContentPosition();
          });
        }, 0);
      }
    } else {
      const frame = props.highlightFrame;
      if (frame) {
        this.targetPosition = {left: frame.x, top: frame.y, width: frame.width, height: frame.height};
        this.setContentPosition();
      }
    }
  }

  getContentPosition() {
    const {highlightFrame, minimumRectSize = {height: 0}, innerPadding = 0} = this.props;
    const {top, height} = this.targetPosition || {top: 0, height: 0};
    const screenVerticalCenter = Constants.screenHeight / 2;
    const targetCenter = top + height / 2;
    const isAlignedTop = targetCenter > screenVerticalCenter;
    let topPosition = isAlignedTop ? top - this.contentHeight : top + height;
    if (!highlightFrame && !isAlignedTop) {
      const minRectHeight = minimumRectSize.height;
      const isUnderMin = height >= minRectHeight;
      topPosition = isUnderMin ? topPosition + innerPadding : targetCenter + minRectHeight / 2 + innerPadding / 2;
    }
    if (topPosition < 0 || topPosition + this.contentHeight > Constants.screenHeight) {
      console.warn(
        `Content is too long and might appear off screen. Please adjust the message length for better results.`
      );
    }
    return topPosition;
  }

  setContentPosition() {
    const top = this.getContentPosition();
    this.setState({contentTopPosition: top});
    this.animate(1);
  }

  // This method will be called more than once in case of layout change!
  getComponentDimensions(event: LayoutChangeEvent) {
    this.contentHeight = event.nativeEvent.layout.height;
    if (this.targetPosition !== undefined) {
      this.setContentPosition();
    }
  }

  onPress = () => {
    this.animate(0);
    this.contentHeight = contentViewHeight;
    this.targetPosition = undefined;
    const {confirmButtonProps} = this.props;
    confirmButtonProps?.onPress?.();
  };

  renderHighlightMessage() {
    const {
      title,
      message,
      titleStyle,
      messageStyle,
      confirmButtonProps,
      textColor,
      titleNumberOfLines,
      messageNumberOfLines,
      pageControlProps
    } = this.props;
    const color = textColor || defaultTextColor;

    return (
      <Animated.View
        style={[styles.highlightContent, {opacity: this.state.fadeAnim, top: this.state.contentTopPosition}]}
        onLayout={this.getComponentDimensions}
        pointerEvents="box-none"
        ref={
          !pageControlProps
            ? (r: ElementRef<any>) => {
              this.viewRef = r;
            }
            : undefined
        }
      >
        {title && (
          <Text
            text60
            style={[
              styles.title,
              {
                color,
                marginBottom: message ? titleBottomMargin : messageBottomMargin
              },
              titleStyle
            ]}
            numberOfLines={titleNumberOfLines}
            // @ts-expect-error
            pointerEvents={'none'}
          >
            {title}
          </Text>
        )}
        {message && (
          <Text
            text70
            style={[styles.message, {color}, messageStyle]}
            numberOfLines={messageNumberOfLines}
            // @ts-expect-error
            pointerEvents={'none'}
          >
            {message}
          </Text>
        )}
        <Button
          label={defaultButtonLabel}
          size={ButtonSize.medium}
          labelStyle={{...Typography.text80, fontWeight: '700'}}
          outline
          outlineColor={color}
          activeBackgroundColor={Colors.rgba(color, 0.3)}
          {...confirmButtonProps}
          onPress={this.onPress}
        />
      </Animated.View>
    );
  }

  render() {
    const {node, contentTopPosition} = this.state;
    if (contentTopPosition === undefined) {
      return null;
    }

    const {
      testID,
      visible,
      highlightFrame,
      overlayColor,
      borderColor,
      borderWidth,
      minimumRectSize,
      innerPadding,
      onBackgroundPress,
      borderRadius,
      pageControlProps
    } = this.props;

    return (
      <HighlighterOverlayView
        testID={testID}
        highlightViewTag={node}
        highlightFrame={highlightFrame}
        visible={visible}
        overlayColor={overlayColor || defaultOverlayColor}
        strokeColor={borderColor || defaultStrokeColor}
        strokeWidth={borderWidth || defaultStrokeWidth}
        minimumRectSize={minimumRectSize}
        innerPadding={innerPadding}
        borderRadius={borderRadius}
        accessible={false}
      >
        <TouchableWithoutFeedback style={styles.touchableOverlay} onPress={onBackgroundPress}>
          {pageControlProps ? (
            <View flex bottom>
              <PageControl
                {...pageControlProps}
                containerStyle={{marginBottom: 24}}
                ref={(r: ElementRef<any>) => (this.viewRef = r)}
              />
              <View accessible accessibilityLabel={'dismiss button'}/>
            </View>
          ) : (
            <View flex accessible accessibilityLabel={'dismiss'} accessibilityRole={'button'}/>
          )}
        </TouchableWithoutFeedback>
        {this.renderHighlightMessage()}
      </HighlighterOverlayView>
    );
  }
}

const styles = StyleSheet.create({
  highlightContent: {
    position: 'absolute',
    padding: contentViewPadding,
    marginRight: contentViewRightMargin,
    alignItems: 'flex-start'
  },
  title: {
    lineHeight: Typography.text60?.lineHeight,
    fontWeight: '900'
  },
  message: {
    marginBottom: messageBottomMargin,
    ...Typography.text70,
    lineHeight: messageLineHeight
  },
  touchableOverlay: {
    ...StyleSheet.absoluteFillObject
  }
});
export {FeatureHighlight}; // for tests
//@ts-ignore typescript - will be fixed when moved to functional component
export default asBaseComponent<FeatureHighlightProps, typeof FeatureHighlight>(FeatureHighlight);
