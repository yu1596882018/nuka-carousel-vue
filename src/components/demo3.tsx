import {createComponent, onMounted, onUpdated, onUnmounted} from '@vue/composition-api';
import {PagingDots, PreviousButton, NextButton} from './default-controls';
import Transitions from './all-transitions';
import AnnounceSlide, {
    defaultRenderAnnounceSlideMessage
} from './announce-slide';
import {
    addEvent,
    removeEvent,
    getPropsByTransitionMode,
    swipeDirection,
    shouldUpdate,
    calcSomeInitialState
} from './utilities/utilities';
import {
    getAlignmentOffset,
    getImgTagStyles,
    getDecoratorStyles,
    getSliderStyles,
    getFrameStyles,
    getTransitionProps
} from './utilities/style-utilities';
import {
    addAccessibility,
    getValidChildren,
    calculateSlideHeight
} from './utilities/bootstrapping-utilities';

export default createComponent({
    name: 'demo3',
    props: {},
    setup() {
        let displayName = 'Carousel';
        let clickDisabled = false;
        let latestTransitioningIndex = null;
        let timers = [];
        let touchObject = {};
        let controlsMap = [
            {funcName: 'renderTopLeftControls', key: 'TopLeft'},
            {funcName: 'renderTopCenterControls', key: 'TopCenter'},
            {funcName: 'renderTopRightControls', key: 'TopRight'},
            {funcName: 'renderCenterLeftControls', key: 'CenterLeft'},
            {funcName: 'renderCenterCenterControls', key: 'CenterCenter'},
            {funcName: 'renderCenterRightControls', key: 'CenterRight'},
            {funcName: 'renderBottomLeftControls', key: 'BottomLeft'},
            {funcName: 'renderBottomCenterControls', key: 'BottomCenter'},
            {funcName: 'renderBottomRightControls', key: 'BottomRight'}
        ];
        let keyCodeConfig = {
            nextSlide: [39, 68, 38, 87],
            previousSlide: [37, 65, 40, 83],
            firstSlide: [81],
            lastSlide: [69],
            pause: [32]
        };

        let childNodesMutationObs = null;

        const state = {
            currentSlide: props.slideIndex,
            dragging: false,
            easing: props.disableAnimation ? '' : easing.easeCircleOut,
            hasInteraction: false, // to remove animation from the initial slide on the page load when non-default slideIndex is used
            isWrappingAround: false,
            left: 0,
            resetWrapAroundPosition: false,
            slideCount: getValidChildren(props.children).length,
            top: 0,
            wrapToIndex: null,
            hasFocus: false,
            ...calcSomeInitialState(props)
        };

        function setState(params: any) {
            Object.keys(params).forEach((key: any) => (state[key] = params[key]));
        }

        onMounted(() => {
            console.log('onMounted');
        });

        onUpdated(() => {
            console.log('onUpdated');
        });

        onUnmounted(() => {
            console.log('onUnmounted');
        });

        function establishChildNodesMutationObserver() {
            const childNodes = getChildNodes();
            if (childNodes.length && 'MutationObserver' in window) {
                childNodesMutationObs = new MutationObserver(() => {
                    setSlideHeightAndWidth();
                });

                const observeChildNodeMutation = node => {
                    childNodesMutationObs.observe(node, {
                        attributeFilter: ['style'],
                        attributeOldValue: false,
                        attributes: true,
                        characterData: false,
                        characterDataOldValue: false,
                        childList: false,
                        subtree: false
                    });
                };

                const childNodesArray = Array.from(childNodes);

                for (const node of childNodesArray) {
                    observeChildNodeMutation(node);
                }
            }
        }

        function disconnectChildNodesMutationObserver() {
            if (childNodesMutationObs instanceof MutationObserver) {
                childNodesMutationObs.disconnect();
            }
        }

        function getlockScrollEvents() {
            const blockEvent = e => {
                if (state.dragging) {
                    const direction = swipeDirection(
                        touchObject.startX,
                        e.touches[0].pageX,
                        touchObject.startY,
                        e.touches[0].pageY,
                        props.vertical
                    );
                    if (direction !== 0) {
                        e.preventDefault();
                    }
                }
            };

            const lockTouchScroll = () => {
                document.addEventListener('touchmove', blockEvent, {
                    passive: false
                });
            };

            const unlockTouchScroll = () => {
                document.removeEventListener('touchmove', blockEvent, {
                    passive: false
                });
            };

            return {
                lockTouchScroll,
                unlockTouchScroll
            };
        }

        function getTouchEvents() {
            if (props.swiping === false) {
                return {
                    onTouchStart: handleMouseOver,
                    onTouchEnd: handleMouseOut
                };
            }

            return {
                onTouchStart: e => {
                    touchObject = {
                        startX: e.touches[0].pageX,
                        startY: e.touches[0].pageY
                    };
                    handleMouseOver();

                    setState({
                        dragging: true
                    });
                },
                onTouchMove: e => {
                    const direction = swipeDirection(
                        touchObject.startX,
                        e.touches[0].pageX,
                        touchObject.startY,
                        e.touches[0].pageY,
                        props.vertical
                    );

                    if (direction !== 0) {
                        e.preventDefault();
                    }

                    const length = props.vertical
                        ? Math.round(
                            Math.sqrt(
                                Math.pow(e.touches[0].pageY - touchObject.startY, 2)
                            )
                        )
                        : Math.round(
                            Math.sqrt(
                                Math.pow(e.touches[0].pageX - touchObject.startX, 2)
                            )
                        );

                    if (length >= 10) {
                        if (clickDisabled === false) props.onDragStart(e);
                        clickDisabled = true;
                    }

                    touchObject = {
                        startX: touchObject.startX,
                        startY: touchObject.startY,
                        endX: e.touches[0].pageX,
                        endY: e.touches[0].pageY,
                        length,
                        direction
                    };

                    setState({
                        left: props.vertical
                            ? 0
                            : getTargetLeft(
                                touchObject.length * touchObject.direction
                            ),
                        top: props.vertical
                            ? getTargetLeft(
                                touchObject.length * touchObject.direction
                            )
                            : 0
                    });
                },
                onTouchEnd: e => {
                    handleSwipe(e);
                    handleMouseOut();
                },
                onTouchCancel: e => {
                    handleSwipe(e);
                }
            };
        }

        function getMouseEvents() {
            if (props.dragging === false) {
                return {
                    onMouseOver: handleMouseOver,
                    onMouseOut: handleMouseOut
                };
            }

            return {
                onMouseOver: handleMouseOver,
                onMouseOut: handleMouseOut,
                onMouseDown: e => {
                    if (e.preventDefault) {
                        e.preventDefault();
                    }

                    touchObject = {
                        startX: e.clientX,
                        startY: e.clientY
                    };

                    setState({
                        dragging: true
                    });
                },

                onMouseMove: e => {
                    if (!state.dragging) {
                        return;
                    }

                    const direction = swipeDirection(
                        touchObject.startX,
                        e.clientX,
                        touchObject.startY,
                        e.clientY,
                        props.vertical
                    );

                    if (direction !== 0) {
                        e.preventDefault();
                    }

                    const length = props.vertical
                        ? Math.round(
                            Math.sqrt(Math.pow(e.clientY - touchObject.startY, 2))
                        )
                        : Math.round(
                            Math.sqrt(Math.pow(e.clientX - touchObject.startX, 2))
                        );

                    // prevents disabling click just because mouse moves a fraction of a pixel
                    if (length >= 10) {
                        if (clickDisabled === false) props.onDragStart(e);
                        clickDisabled = true;
                    }

                    touchObject = {
                        startX: touchObject.startX,
                        startY: touchObject.startY,
                        endX: e.clientX,
                        endY: e.clientY,
                        length,
                        direction
                    };

                    setState({
                        left: props.vertical
                            ? 0
                            : getTargetLeft(
                                touchObject.length * touchObject.direction
                            ),
                        top: props.vertical
                            ? getTargetLeft(
                                touchObject.length * touchObject.direction
                            )
                            : 0
                    });
                },

                onMouseUp: e => {
                    if (
                        touchObject.length === 0 ||
                        touchObject.length === undefined
                    ) {
                        setState({dragging: false});
                        return;
                    }

                    handleSwipe(e);
                },

                onMouseLeave: e => {
                    if (!state.dragging) {
                        return;
                    }

                    handleSwipe(e);
                }
            };
        }

        function pauseAutoplay() {
            if (props.autoplay) {
                autoplayPaused = true;
                stopAutoplay();
            }
        }

        function unpauseAutoplay() {
            if (props.autoplay && autoplayPaused) {
                startAutoplay();
                autoplayPaused = null;
            }
        }

        function handleMouseOver() {
            if (props.pauseOnHover) {
                pauseAutoplay();
            }
        }

        function handleMouseOut() {
            if (autoplayPaused) {
                unpauseAutoplay();
            }
        }

        function handleFocus() {
            setState({hasFocus: true});
        }

        function handleBlur() {
            setState({hasFocus: false});
        }

        function handleClick(event) {
            if (clickDisabled === true) {
                if (event.metaKey || event.shiftKey || event.altKey || event.ctrlKey) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();

                if (event.nativeEvent) {
                    event.nativeEvent.stopPropagation();
                }
            }
        }

        function handleSwipe() {
            let slidesToShow = state.slidesToShow;
            if (props.slidesToScroll === 'auto') {
                slidesToShow = state.slidesToScroll;
            }

            const touchLength = touchObject.length || 0;

            if (touchLength > state.slideWidth / slidesToShow / 5) {
                if (touchObject.direction === 1) {
                    if (
                        state.currentSlide + 1 >= state.slideCount &&
                        !props.wrapAround
                    ) {
                        setState({easing: easing[props.edgeEasing]});
                    } else {
                        nextSlide();
                    }
                } else if (touchObject.direction === -1) {
                    if (state.currentSlide <= 0 && !props.wrapAround) {
                        setState({easing: easing[props.edgeEasing]});
                    } else {
                        previousSlide();
                    }
                }
            } else if (touchLength > 0) {
                goToSlide(state.currentSlide);
            }

            // wait for `handleClick` event before resetting clickDisabled
            timers.push(
                setTimeout(() => {
                    clickDisabled = false;
                }, 0)
            );
            touchObject = {};

            setState({
                dragging: false
            });
        }

// eslint-disable-next-line complexity
        function handleKeyPress(e) {
            if (state.hasFocus && props.enableKeyboardControls) {
                const actionName = keyCodeMap[e.keyCode];
                switch (actionName) {
                    case 'nextSlide':
                        nextSlide();
                        break;
                    case 'previousSlide':
                        previousSlide();
                        break;
                    case 'firstSlide':
                        goToSlide(0, props);
                        break;
                    case 'lastSlide':
                        goToSlide(state.slideCount - 1, props);
                        break;
                    case 'pause':
                        if (state.pauseOnHover && props.autoplay) {
                            setState({pauseOnHover: false});
                            pauseAutoplay();
                            break;
                        } else {
                            setState({pauseOnHover: true});
                            unpauseAutoplay();
                            break;
                        }
                }
            }
        }

        function getKeyCodeMap(keyCodeConfig) {
            const keyCodeMap = {};
            Object.keys(keyCodeConfig).forEach(actionName => {
                keyCodeConfig[actionName].forEach(
                    keyCode => (keyCodeMap[keyCode] = actionName)
                );
            });
            return keyCodeMap;
        }

        function autoplayIterator() {
            if (props.wrapAround) {
                if (props.autoplayReverse) {
                    previousSlide();
                } else {
                    nextSlide();
                }
                return;
            }
            if (props.autoplayReverse) {
                if (state.currentSlide !== 0) {
                    previousSlide();
                } else {
                    stopAutoplay();
                }
            } else if (
                state.currentSlide !==
                state.slideCount - state.slidesToShow
            ) {
                nextSlide();
            } else {
                stopAutoplay();
            }
        }

        function startAutoplay() {
            autoplayID = setInterval(
                autoplayIterator,
                props.autoplayInterval
            );
        }

        function resetAutoplay() {
            if (props.autoplay && !autoplayPaused) {
                stopAutoplay();
                startAutoplay();
            }
        }

        function stopAutoplay() {
            if (autoplayID) {
                clearInterval(autoplayID);
            }
        }

// Animation Method

        function getTargetLeft(touchOffset, slide) {
            const target = slide || state.currentSlide;

            let offset = getAlignmentOffset(target, {...props, ...state});
            let left = state.slideWidth * target;

            const lastSlide =
                state.currentSlide > 0 &&
                target + state.slidesToScroll >= state.slideCount;

            if (
                lastSlide &&
                props.slideWidth !== 1 &&
                !props.wrapAround &&
                props.slidesToScroll === 'auto'
            ) {
                left =
                    state.slideWidth * state.slideCount - state.frameWidth;
                offset = 0;
                offset -= props.cellSpacing * (state.slideCount - 1);
            }

            offset -= touchOffset || 0;

            return (left - offset) * -1;
        }

        function getOffsetDeltas() {
            let offset = 0;

            if (state.isWrappingAround) {
                offset = getTargetLeft(null, state.wrapToIndex);
            } else {
                offset = getTargetLeft(
                    touchObject.length * touchObject.direction
                );
            }

            return {
                tx: [props.vertical ? 0 : offset],
                ty: [props.vertical ? offset : 0]
            };
        }

        function isEdgeSwiping() {
            const {
                currentSlide,
                slideCount,
                slideWidth,
                slideHeight,
                slidesToShow
            } = state;
            const {tx, ty} = getOffsetDeltas();
            const offset = getAlignmentOffset(currentSlide, {
                ...props,
                ...state
            });

            if (props.vertical) {
                const rowHeight = slideHeight / slidesToShow;
                const slidesLeftToShow = slideCount - slidesToShow;
                const lastSlideLimit = rowHeight * slidesLeftToShow;

                const offsetTy = ty[0] - offset;
                // returns true if ty offset is outside first or last slide
                return offsetTy > 0 || -offsetTy > lastSlideLimit;
            }

            const offsetTx = tx[0] - offset;
            // returns true if tx offset is outside first or last slide
            return offsetTx > 0 || -offsetTx > slideWidth * (slideCount - 1);
        }

// Action Methods

        function goToSlide(index, props) {
            if (props === undefined) {
                props = props;
            }
            latestTransitioningIndex = index;

            setState({hasInteraction: true, easing: easing[props.easing]});
            const previousSlide = state.currentSlide;

            if (index >= state.slideCount || index < 0) {
                if (!props.wrapAround) {
                    return;
                }

                if (index >= state.slideCount) {
                    props.beforeSlide(state.currentSlide, 0);
                    setState(
                        prevState => ({
                            left: props.vertical
                                ? 0
                                : getTargetLeft(
                                    state.slideWidth,
                                    prevState.currentSlide
                                ),
                            top: props.vertical
                                ? getTargetLeft(
                                    state.slideWidth,
                                    prevState.currentSlide
                                )
                                : 0,
                            currentSlide: 0,
                            isWrappingAround: true,
                            wrapToIndex: state.slideCount
                        }),
                        () => {
                            timers.push(
                                setTimeout(() => {
                                    if (index === latestTransitioningIndex) {
                                        resetAutoplay();
                                        if (index !== previousSlide) {
                                            props.afterSlide(0);
                                        }
                                    }
                                }, props.speed)
                            );
                        }
                    );
                    return;
                } else {
                    const endSlide =
                        index < 0
                            ? state.slideCount + index
                            : state.slideCount - state.slidesToScroll;
                    props.beforeSlide(state.currentSlide, endSlide);
                    setState(
                        prevState => ({
                            left: props.vertical
                                ? 0
                                : getTargetLeft(0, prevState.currentSlide),
                            top: props.vertical
                                ? getTargetLeft(0, prevState.currentSlide)
                                : 0,
                            currentSlide: endSlide,
                            isWrappingAround: true,
                            wrapToIndex: index
                        }),
                        () => {
                            timers.push(
                                setTimeout(() => {
                                    if (index === latestTransitioningIndex) {
                                        resetAutoplay();
                                        if (index !== previousSlide) {
                                            props.afterSlide(state.slideCount - 1);
                                        }
                                    }
                                }, props.speed)
                            );
                        }
                    );
                    return;
                }
            }

            props.beforeSlide(state.currentSlide, index);

            setState(
                {
                    currentSlide: index
                },
                () => {
                    timers.push(
                        setTimeout(() => {
                            if (index === latestTransitioningIndex) {
                                resetAutoplay();
                                if (index !== previousSlide) {
                                    props.afterSlide(index);
                                }
                            }
                        }, props.speed)
                    );
                }
            );
        }

        function nextSlide() {
            const {slidesToScroll, currentSlide, slideWidth, slideCount} = state;

            let targetSlideIndex = currentSlide + slidesToScroll;
            let slidesToShow = state.slidesToShow;

            if (props.slidesToScroll === 'auto') {
                const {length: swipeDistance} = touchObject;

                if (swipeDistance > 0) {
                    targetSlideIndex =
                        Math.round(swipeDistance / slideWidth) + currentSlide;
                } else {
                    slidesToShow = slidesToScroll;
                }
            }

            if (
                currentSlide >= slideCount - slidesToShow &&
                !props.wrapAround &&
                props.cellAlign === 'left'
            ) {
                return;
            }

            if (props.wrapAround) {
                goToSlide(targetSlideIndex);
            } else {
                if (props.slideWidth !== 1) {
                    goToSlide(targetSlideIndex);
                    return;
                }

                const offset = targetSlideIndex;
                const leftAlignSlideIndex =
                    props.scrollMode === 'page'
                        ? offset
                        : Math.min(offset, slideCount - slidesToShow);

                const nextSlideIndex =
                    props.cellAlign !== 'left' ? offset : leftAlignSlideIndex;

                // If nextSlideIndex is larger than last index, then
                // just navigate to last index
                goToSlide(Math.min(nextSlideIndex, slideCount - 1));
            }
        }

        function previousSlide() {
            const {slidesToScroll, slideWidth, currentSlide} = state;

            let targetSlideIndex = currentSlide - slidesToScroll;
            const {length: swipeDistance} = touchObject;

            if (props.slidesToScroll === 'auto' && swipeDistance > 0) {
                targetSlideIndex = currentSlide - Math.round(swipeDistance / slideWidth);
            }

            if (currentSlide <= 0 && !props.wrapAround) {
                return;
            }

            if (props.wrapAround) {
                goToSlide(targetSlideIndex);
            } else {
                goToSlide(Math.max(0, targetSlideIndex));
            }
        }

// Bootstrapping

        function bindEvents() {
            if (ExecutionEnvironment.canUseDOM) {
                addEvent(window, 'resize', onResize);
                addEvent(document, 'visibilitychange', onVisibilityChange);
                addEvent(document, 'keydown', handleKeyPress);
            }
        }

        function onResize() {
            setDimensions(null, props.onResize);
        }

        function onVisibilityChange() {
            if (document.hidden) {
                pauseAutoplay();
            } else {
                unpauseAutoplay();
            }
        }

        function unbindEvents() {
            if (ExecutionEnvironment.canUseDOM) {
                removeEvent(window, 'resize', onResize);
                removeEvent(document, 'visibilitychange', onVisibilityChange);
                removeEvent(document, 'keydown', handleKeyPress);
            }
        }

        function calcSlideHeightAndWidth(props) {
            // slide height
            props = props || props;
            const childNodes = getChildNodes();
            const slideHeight = calculateSlideHeight(props, state, childNodes);

            //slide width
            const {slidesToShow} = getPropsByTransitionMode(props, ['slidesToShow']);
            const frame = frame;
            let slideWidth;

            if (props.animation === 'zoom') {
                slideWidth = frame.offsetWidth - (frame.offsetWidth * 15) / 100;
            } else if (typeof props.slideWidth !== 'number') {
                slideWidth = parseInt(props.slideWidth);
            } else if (props.vertical) {
                slideWidth = (slideHeight / slidesToShow) * props.slideWidth;
            } else {
                slideWidth = (frame.offsetWidth / slidesToShow) * props.slideWidth;
            }

            if (!props.vertical) {
                slideWidth -= props.cellSpacing * ((100 - 100 / slidesToShow) / 100);
            }

            return {slideHeight, slideWidth};
        }

        function setSlideHeightAndWidth() {
            const {slideHeight, slideWidth} = calcSlideHeightAndWidth();

            if (
                slideHeight !== state.slideHeight ||
                slideWidth !== state.slideWidth ||
                isWrapped
            ) {
                isWrapped = false;
                setState({slideHeight, slideWidth});
            }
        }

        function setDimensions(props, stateCb = () => {
        }) {
            props = props || props;

            const {slidesToShow, cellAlign, scrollMode} = getPropsByTransitionMode(
                props,
                ['slidesToShow', 'cellAlign', 'scrollMode']
            );

            const frame = frame;
            const {slideHeight, slideWidth} = calcSlideHeightAndWidth(props);

            const frameHeight = slideHeight + props.cellSpacing * (slidesToShow - 1);
            const frameWidth = props.vertical ? frameHeight : frame.offsetWidth;

            let {slidesToScroll} = getPropsByTransitionMode(props, [
                'slidesToScroll'
            ]);

            if (slidesToScroll === 'auto' || scrollMode === 'page') {
                slidesToScroll = Math.floor(
                    frameWidth / (slideWidth + props.cellSpacing)
                );
            }

            setState(
                {
                    frameWidth,
                    slideHeight,
                    slidesToScroll,
                    slidesToShow,
                    slideWidth,
                    cellAlign
                },
                () => {
                    stateCb();
                }
            );
        }

        function getChildNodes() {
            return frame.childNodes[0].childNodes;
        }

        function getCurrentChildNodeImg() {
            const childNodes = getChildNodes();
            const currentChildNode = childNodes[props.slideIndex];
            return currentChildNode
                ? currentChildNode.getElementsByTagName('img')[0]
                : null;
        }

        function setLeft() {
            const newLeft = props.vertical ? 0 : getTargetLeft();
            const newTop = props.vertical ? getTargetLeft() : 0;

            if (newLeft !== state.left || newTop !== state.top) {
                setState({
                    left: newLeft,
                    top: newTop
                });
            }
        }

        function renderControls() {
            if (props.withoutControls) {
                return controlsMap.map(() => null);
            } else {
                return controlsMap.map(({funcName, key}) => {
                    const func = props[funcName];
                    const controlChildren =
                        func &&
                        typeof func === 'function' &&
                        func({
                            cellAlign: props.cellAlign,
                            cellSpacing: props.cellSpacing,
                            currentSlide: state.currentSlide,
                            defaultControlsConfig: props.defaultControlsConfig,
                            frameWidth: state.frameWidth,
                            goToSlide: index => goToSlide(index),
                            left: state.left,
                            nextSlide: () => nextSlide(),
                            previousSlide: () => previousSlide(),
                            scrollMode: props.scrollMode,
                            slideCount: state.slideCount,
                            slidesToScroll: state.slidesToScroll,
                            slidesToShow: state.slidesToShow,
                            slideWidth: state.slideWidth,
                            top: state.top,
                            vertical: props.vertical,
                            wrapAround: props.wrapAround
                        });

                    return (
                        controlChildren && (
                            <div
                                key={key}
                                className={[
                                    `slider-control-${key.toLowerCase()}`,
                                    props.defaultControlsConfig.containerClassName || ''
                                ]
                                    .join(' ')
                                    .trim()}
                                style={{
                                    ...getDecoratorStyles(key),
                                    ...props.getControlsContainerStyles(key)
                                }}
                            >
                                {controlChildren}
                            </div>
                        )
                    );
                });
            }
        }


        const {currentSlide, slideCount, frameWidth} = state;
        const {
            disableAnimation,
            frameOverflow,
            framePadding,
            renderAnnounceSlideMessage,
            slidesToShow,
            vertical
        } = props;
        const duration =
            state.dragging ||
            (!state.dragging &&
                state.resetWrapAroundPosition &&
                props.wrapAround) ||
            disableAnimation ||
            !state.hasInteraction
                ? 0
                : props.speed;

        const frameStyles = getFrameStyles(
            frameOverflow,
            vertical,
            framePadding,
            frameWidth
        );
        const touchEvents = getTouchEvents();
        const mouseEvents = getMouseEvents();
        const TransitionControl = Transitions[props.transitionMode];
        const validChildren = getValidChildren(props.children);

        return () => (
            <div
                className={['slider', props.className || ''].join(' ').trim()}
                onFocus={handleFocus}
                onBlur={handleBlur}
                ref={props.innerRef}
                tabIndex={0}
                style={Object.assign(
                    {},
                    getSliderStyles(props.width, props.height),
                    props.style
                )}
            >
                {!props.autoplay && (
                    <AnnounceSlide
                        message={renderAnnounceSlideMessage({currentSlide, slideCount})}
                    />
                )}
                <div
                    className="slider-frame"
                    ref={frame => (frame = frame)}
                    style={frameStyles}
                    {...touchEvents}
                    {...mouseEvents}
                    onClickCapture={handleClick}
                >
                    <Animate
                        show
                        start={{tx: 0, ty: 0}}
                        update={() => {
                            const {tx, ty} = getOffsetDeltas();

                            if (
                                props.disableEdgeSwiping &&
                                !props.wrapAround &&
                                isEdgeSwiping()
                            ) {
                                return {};
                            } else {
                                return {
                                    tx,
                                    ty,
                                    timing: {
                                        duration,
                                        ease: state.easing
                                    },
                                    events: {
                                        end: () => {
                                            const newLeft = props.vertical
                                                ? 0
                                                : getTargetLeft();
                                            const newTop = props.vertical
                                                ? getTargetLeft()
                                                : 0;

                                            if (
                                                newLeft !== state.left ||
                                                newTop !== state.top
                                            ) {
                                                setState(
                                                    {
                                                        left: newLeft,
                                                        top: newTop,
                                                        isWrappingAround: false,
                                                        resetWrapAroundPosition: true
                                                    },
                                                    () => {
                                                        setState({
                                                            resetWrapAroundPosition: false
                                                        });
                                                    }
                                                );
                                            }
                                        }
                                    }
                                };
                            }
                        }}
                        children={({tx, ty}) => (
                            <TransitionControl
                                {...getTransitionProps(props, state)}
                                deltaX={tx}
                                deltaY={ty}
                            >
                                {addAccessibility(validChildren, slidesToShow, currentSlide)}
                            </TransitionControl>
                        )}
                    />
                </div>

                {renderControls()}

                {props.autoGenerateStyleTag && (
                    <style
                        type="text/css"
                        dangerouslySetInnerHTML={{__html: getImgTagStyles()}}
                    />
                )}
            </div>
        );
    },
});
