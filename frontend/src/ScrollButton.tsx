import * as React from 'react';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class ScrollButton extends React.Component<{}, { showArrow: boolean }> {
    state = { showArrow: false };

    componentDidMount() {
        const subj = new BehaviorSubject<boolean>(false);
        const onscroll = () => subj.next(window.scrollY > 0);
        window.onscroll = onscroll;
        document.onscroll = onscroll;
        subj.pipe(debounceTime(250)).subscribe((showArrow) => this.setState({ showArrow }));
    }

    render () {
        // Scrolls smoothly, as Bootstrap sets scroll-behavior: smooth
        return <button title='Back to top' className='bloc-button btn btn-d btnScrollToTop' style={{ display: this.state.showArrow ? 'block' : 'none' }}
                onClick={() => window.scrollTo({ top: 0 })}>
                    <span className='bi bi-chevron-up'></span>
                </button>;
    }
}
