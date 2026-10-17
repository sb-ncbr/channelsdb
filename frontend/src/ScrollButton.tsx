import * as React from 'react';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class ScrollButton extends React.Component<{}, {}> {
    props: any;
    state = {
        intervalId: 0,
        showArrow: false,
     };
    componentDidMount() {
        const subj = new BehaviorSubject<boolean>(false);
        const onscroll = () => subj.next(window.scrollY > 0);
        window.onscroll = onscroll;
        document.onscroll = onscroll;
        subj.pipe(debounceTime(250)).subscribe((showArrow) => this.setState({ showArrow }));
    }

    constructor(props: {}) {
        super(props);

        this.state = {
            intervalId: 0,
            showArrow: false,
        };
    }

    scrollStep() {
        if (window.pageYOffset === 0) {
            clearInterval(this.state.intervalId);
        }
        window.scroll(0, window.pageYOffset - this.props.scrollStepInPx);
    }

    scrollToTop() {
        let intervalId = setInterval(this.scrollStep.bind(this), this.props.delayInMs);
        this.setState({ intervalId: intervalId });
    }

    render () {
        return <button title='Back to top' className='bloc-button btn btn-d btnScrollToTop' style={{ display: this.state.showArrow ? 'block' : 'none' }}
                onClick={ () => { this.scrollToTop(); }}>
                    <span className='glyphicon glyphicon-chevron-up'></span>
                </button>;
    }
}
