import './App.css';
import {createComponent, ref, reactive} from '@vue/composition-api';
// import HelloWorld from './components/demo3';
import ImageLogo from './assets/logo.png';

export default createComponent({
    name: 'App',
    setup() {
        const colors = [
            '7732bb',
            '047cc0',
            '00884b',
            'e3bc14',
            'db7c00',
            'aa231s',
            'e3bc13',
            'db7c0a',
            'aa231f'
        ];

        const state = reactive({
            animation: undefined,
            autoplay: false,
            cellAlign: 'left',
            heightMode: 'max',
            length: colors.length,
            scrollMode: 'remainder',
            slideIndex: 0,
            slidesToScroll: 1,
            slidesToShow: 1,
            transitionMode: 'scroll',
            underlineHeader: false,
            withoutControls: false,
            wrapAround: false,
            zoomScale: 0.5,
        });

        let {
            animation,
            autoplay,
            cellAlign,
            heightMode,
            length,
            scrollMode,
            slideIndex,
            slidesToScroll,
            slidesToShow,
            transitionMode,
            underlineHeader,
            withoutControls,
            wrapAround,
            zoomScale
        } = state;

        function setSlideIndex() {
            slideIndex = 5;
            console.log(slideIndex);
        }

        const renderTopControls = (currentSlide: any) => {
            return (
                <div
                    style={{
                        fontFamily: 'Helvetica',
                        color: '#fff',
                        textDecoration: underlineHeader ? 'underline' : 'none'
                    }}
                >
                    Nuka Carousel: Slide {Math.ceil(currentSlide) + 1}
                </div>
            );
        };


        const slides = colors.slice(0, length).map((color, index) => (
            <img
                src={`https://via.placeholder.com/400/${color}/ffffff/&text=slide${index +
                1}`}
                alt={`Slide ${index + 1}`}
                key={color}
                onclick={() => underlineHeader != underlineHeader}
                style={{
                    height: heightMode === 'current' ? 100 * (index + 1) : 400
                }}
            />
        ));


        // @ts-ignore
        // @ts-ignore
        // @ts-ignore
        return () => (
            <div id="app">
                <div style={{width: '50%', margin: 'auto'}}>
                    <div
                        animation={animation}
                        autoplay={autoplay}
                        cellAlign={cellAlign}
                        heightMode={heightMode}
                        scrollMode={scrollMode}
                        slideIndex={slideIndex}
                        slideListMargin={0}
                        slidesToScroll={slidesToScroll}
                        slidesToShow={slidesToShow}
                        transitionMode={transitionMode}
                        withoutControls={withoutControls}
                        wrapAround={wrapAround}
                        zoomScale={Number(zoomScale || 0)}
                        renderAnnounceSlideMessage={({currentSlide, slideCount}: {
                            currentSlide: any,
                            slideCount: any
                        }) => {
                            return `Showing slide ${currentSlide + 1} of ${slideCount}`;
                        }}
                        renderTopCenterControls={({currentSlide}: {
                            currentSlide: any
                        }) =>
                            renderTopControls(currentSlide)
                        }>
                        {slides}
                    </div>

                    <div>
                        {slideIndex}
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        margin: '10px 0'
                    }}>
                        <div>
                            <button onclick={() => slideIndex = 0}>1</button>
                            <button onclick={() => slideIndex = 1}>2</button>
                            <button onclick={() => slideIndex = 2}>3</button>
                            <button onclick={() => slideIndex = 3}>4</button>
                            <button onclick={() => slideIndex = 4}>5</button>
                            <button onclick={setSlideIndex}>6</button>
                            <button onclick={() => slideIndex = 6}>7</button>
                            <button onclick={() => slideIndex = 7}>8</button>
                            <button onclick={() => slideIndex = 8}>9</button>
                        </div>
                        {slidesToShow > 1.0 && (
                            <div>
                                <button onclick={() => cellAlign = 'left'}>Left</button>
                                <button onclick={() => cellAlign = 'center'}>Center</button>
                                <button onclick={() => cellAlign = 'right'}>Right</button>
                            </div>
                        )}
                    </div>
                    <div className="wrapper">
                        <div style={{textAlign: 'center'}}>
                            <button
                                onclick={() => length = (length === 9 ? 3 : 9)}
                            >
                                Toggle Show 3 Slides Only
                            </button>
                            <button
                                onclick={() =>
                                    transitionMode = (transitionMode === 'fade' ? 'scroll' : 'fade')
                                }
                            >
                                Toggle Fade {transitionMode === 'fade' ? 'Off' : 'On'}
                            </button>
                            <button
                                onclick={() => wrapAround = !wrapAround}
                            >
                                Toggle Wrap Around
                            </button>
                            <button onclick={() => autoplay = !autoplay}>
                                Toggle Autoplay {autoplay === true ? 'Off' : 'On'}
                            </button>
                            <button
                                onclick={() =>
                                    scrollMode != scrollMode
                                }
                            >
                                Toggle ScrollMode: {scrollMode}
                            </button>
                        </div>

                        {/*{transitionMode !== 'fade' && (
                            <>
                                <div style={{textAlign: 'center'}}>
                                    <div style={{marginLeft: 'auto'}}>
                                        <button
                                            onclick={() => {
                                                setSlidesToShow(slidesToShow === 3 ? 1 : 3);
                                                setSlidesToScroll(slidesToScroll === 'auto' ? 1 : 'auto');
                                            }}
                                        >
                                            Toggle Drag Multiple{' '}
                                            {slidesToShow > 1 && slidesToScroll === 'auto' ? 'Off' : 'On'}
                                        </button>
                                        <button
                                            onclick={() =>
                                                setSlidesToShow(prevSlidesToShow =>
                                                    prevSlidesToShow > 1.0 ? 1.0 : 1.25
                                                )
                                            }
                                        >
                                            Toggle Partially Visible Slides
                                        </button>
                                        <button
                                            onclick={() =>
                                                setHeightMode(prevHeightMode =>
                                                    prevHeightMode === 'current' ? 'max' : 'current'
                                                )
                                            }
                                        >
                                            Toggle Height Mode Current
                                        </button>
                                        <button
                                            onclick={() =>
                                                setWithoutControls(
                                                    prevWithoutControls => !prevWithoutControls
                                                )
                                            }
                                        >
                                            Toggle Controls
                                        </button>
                                    </div>
                                </div>
                                <div style={{textAlign: 'center'}}>
                                    {animation === 'zoom' && (
                                        <input
                                            type="number"
                                            value={zoomScale}
                                            onChange={handleZoomScaleChange}
                                        />
                                    )}
                                    <button
                                        onclick={() => {
                                            setAnimation(prevAnimation =>
                                                prevAnimation === 'zoom' ? undefined : 'zoom'
                                            );
                                            setCellAlign('center');
                                        }}
                                    >
                                        Toggle Zoom Animation {animation === 'zoom' ? 'Off' : 'On'}
                                    </button>
                                    <button
                                        onclick={() => {
                                            setSlidesToScroll(prevSlidesToScroll =>
                                                prevSlidesToScroll === 1 ? 2 : 1
                                            );
                                            setCellAlign('center');
                                        }}
                                    >
                                        Toggle SlidesToScroll {slidesToScroll === 1 ? 2 : 1}
                                    </button>
                                </div>
                            </>
                        )}*/}
                    </div>
                </div>

            </div>
        );
    },
});
