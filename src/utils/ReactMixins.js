module.exports = function () {

    this.componentWillMount = function () {
        const $ = require("jquery");
        const _self = this;

        $(window).on('resize', function (e) {
            _self.updateSize();
        });

        this.setState({width: this.props.width});

    };
    this.componentDidMount = function () {
        this.updateSize();
    };
    this.componentWillUnmount = function () {
        const $ = require("jquery");
        $(window).off('resize');
    };

    this.updateSize = function () {
        const $ = require("jquery");
        const ReactDOM = require('react-dom');
        const node = ReactDOM.findDOMNode(this);
        const parentWidth = $(node).width();
        if (parentWidth < this.props.width) {
            this.setState({width: parentWidth - 20});
        } else {
            this.setState({width: this.props.width});
        }
    };
};
