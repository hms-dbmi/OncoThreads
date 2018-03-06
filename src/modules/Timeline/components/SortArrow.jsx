import React from 'react';

class SortArrow extends React.Component{
    constructor(){
        super();
        this.state={
            sort:"ascending",
            fill:"lightgray"
        };
        this.toggleSort=this.toggleSort.bind(this);
        this.mouseEnter=this.mouseEnter.bind(this);
        this.mouseLeave=this.mouseLeave.bind(this);

    }
    toggleSort(){
        if(this.state.sort==="ascending"){
            this.setState({sort:"descending"});
            this.props.eventStore.sortEvents(this.props.attribute,"ascending")
        }
        else{
            this.setState({sort:"ascending"});
            this.props.eventStore.sortEvents(this.props.attribute,"descending")
        }
    }
    mouseEnter(){
        this.setState({fill:"black"});
    }
        mouseLeave(){
        this.setState({fill:"lightgray"});
    }
    render(){
        let arrow;
        if(this.state.sort==="ascending"){
            arrow=(<g transform={this.props.transform}>
                <rect width={2} height={5} x={4} y={5} fill={this.state.fill}   />
                <polygon points="0,5 10,5 5,0" fill={this.state.fill}  />
                <rect fill="none" width={10} height={10} pointerEvents="visible" onClick={this.toggleSort} onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave}/>
                <text x={12} y={10} fontSize={8}>{this.props.attribute}</text>
            </g>);
        }
        else{
            arrow=(<g transform={this.props.transform}>
                <rect width={2} height={5} x={4} fill={this.state.fill}  />
                <polygon points="5,10 10,5 0,5" fill={this.state.fill}  />
                <rect fill="none" width={10} height={10} pointerEvents="visible" onClick={this.toggleSort} onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave}/>
                <text x={12} y={10} fontSize={8}>{this.props.attribute}</text>
            </g>);
        }
        return(
            <g>
            {arrow}
            </g>
        )
    }

}
export default SortArrow;