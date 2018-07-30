import React from "react";
import {observer} from "mobx-react";
import FontAwesome from 'react-fontawesome';
import {extendObservable} from "mobx";


/*
 * Patient axis pointing to the right
 */
const GlobalTimeAxis = observer(class GlobalTimeAxis extends React.Component {

    /*constructor(props){
        super(props)
        this.state = {
          listOpen: false,
          headerTitle: this.props.title,

          list: [
            {
                id: 0,
                title: 'Days',
                selected: false,
                key: 'location'
            },
            {
              id: 1,
              title: 'Months',
              selected: false,
              key: 'location'
            },
            {
              id: 2,
              title: 'Year',
              selected: false,
              key: 'location'
            }
          ]
        }


    }  

    handleClickOutside(){
        this.setState({
          listOpen: false
        })
      }
      toggleList(){
        this.setState(prevState => ({
          listOpen: !prevState.listOpen
        }))
      }
*/




    constructor() {
        super();
        
        this.state = {
        showMenu: false
       
        };
        

        extendObservable(this, {
            timeVar: 1,
            timeValue: "days"
            //timeline: []
        });


        this.showMenu = this.showMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        
    }
    
    showMenu(event) {
        event.preventDefault();
        
        this.setState({ showMenu: true }, () => {
        document.addEventListener('click', this.closeMenu);
        });
    }
    
    closeMenu(event) {
        
        if (!this.dropdownMenu.contains(event.target)) {
        
        this.setState({ showMenu: false }, () => {
            document.removeEventListener('click', this.closeMenu);
        });  
        
        }
    }



    handleClick(e) {
        e.preventDefault();
        console.log(e.target.id);
        this.timeVar=e.target.id;
        this.timeValue=e.target.value;
      }
    render() {



        //const list = this.state.list;
        //const{listOpen, headerTitle} = this.state;

        /* return (
                 <svg width={this.props.width} height={this.props.height}>
                     <defs>
                         <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                                 markerUnits="strokeWidth">
                             <path d="M0,0 L0,6 L9,3 z" fill="darkgray"/>
                         </marker>
                     </defs>
                     <g>
                         <line x1="72" y1="90" x2="72" y2={this.props.height / 2 +10 } stroke="darkgray"
                               markerEnd="url(#arrow)" strokeWidth="2"/>
                         <text  textAnchor="end"
                                 x= "71"//{(this.props.width-150)/2}

                                 y={this.props.height / 2 - 140}>
                                 Time (days)
                         </text>
                     </g>

                     <g>
                         <line x1="130" y1="30" x2="130" y2={this.props.height -10} stroke="darkgray"
                              strokeWidth="2"/>

                          <text textAnchor="end" x= "125" y= "40">0</text>

                          <text textAnchor="end" x= "125" y= {(this.props.height -10 -40)/4}>{Math.floor(this.props.maxTimeInDays/4)}</text>

                          <text textAnchor="end" x= "125" y= {(this.props.height -10 -40) *2 /4}>{Math.floor(this.props.maxTimeInDays * 2 /4)}</text>

                          <text textAnchor="end" x= "125" y= {(this.props.height -10 -40) *3 /4}>{Math.floor(this.props.maxTimeInDays * 3 /4)}</text>

                          <text textAnchor="end" x= "125" y= {this.props.height -10 } >{this.props.maxTimeInDays}</text>

                     </g>

                 </svg>
         );*/

        /*return (
            <svg width={this.props.width} height={this.props.height}>
                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                            markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="darkgray"/>
                    </marker>
                </defs>
                <g>
                    
                    <text  textAnchor="end"
                            x= "71"//{(this.props.width-150)/2} 
                    
                            y={this.props.height / 2 - 140}>
                            Time (days) 
                    </text>
                
                    <line x1="120" y1="30" x2="115" y2={this.props.height -18} stroke="darkgray"
                          markerEnd="url(#arrow)" strokeWidth="2"/>

                     <text textAnchor="end" x= "110" y= "40">0</text>

                     <text textAnchor="end" x= "110" y= {(this.props.height -10 -40)/4}>{Math.floor(this.props.maxTimeInDays/4)}</text>

                     <text textAnchor="end" x= "110" y= {(this.props.height -10 -40) *2 /4}>{Math.floor(this.props.maxTimeInDays * 2 /4)}</text>

                     <text textAnchor="end" x= "110" y= {(this.props.height -10 -40) *3 /4}>{Math.floor(this.props.maxTimeInDays * 3 /4)}</text>

                     <text textAnchor="end" x= "110" y= {this.props.height -20 } >{this.props.maxTimeInDays}</text>   
                    
                </g>

            </svg>
    );*/


        return (
            <div>

        <div>
            <button onClick={this.showMenu} >
            Show time as..
            </button>
            
            {
            this.state.showMenu
                ? (
                <div
                    className="menu"
                    ref={(element) => {
                    this.dropdownMenu = element;
                    }}
                >
                    <button id="1" value="days" onClick={e => this.handleClick(e)} > Days </button>
                    <button id="30" value="months" onClick={e => this.handleClick(e)} > Months </button>
                    <button id="365" value="years" onClick={e => this.handleClick(e)} > Years </button>
                </div>
                )
                : (
                null
                )
            }
        </div>

        <div>
            <svg width={this.props.width / 3} height={this.props.height}>
                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                            markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="darkgray"/>
                    </marker>
                </defs>


                <g>

                    <text textAnchor="end"
                          x="37"

                          y={this.props.height / 2 - 140}
                          fontSize="10px"
                    >
                        <tspan x="37" dy="1em">Time</tspan>

                        <tspan x="39" dy="1em">({this.timeValue})</tspan>
                        


                        
                    </text>

                   


                    <line x1="43" y1="30" x2="43" y2={this.props.height - 18} stroke="darkgray"
                          markerEnd="url(#arrow)" strokeWidth="2"/>

                    <text textAnchor="end" x="32" y="40" fontSize="10px">0</text>

                    <text textAnchor="end" x="32" y={(this.props.height - 10 - 40) / 4}
                          fontSize="10px">{Math.floor((this.props.maxTimeInDays / 4) / (this.timeVar)  )}</text>

                    <text textAnchor="end" x="32" y={(this.props.height - 10 - 40) * 2 / 4}
                          fontSize="10px">{Math.floor((this.props.maxTimeInDays * 2 / 4)/ (this.timeVar))}</text>

                    <text textAnchor="end" x="32" y={(this.props.height - 10 - 40) * 3 / 4}
                          fontSize="10px">{Math.floor((this.props.maxTimeInDays * 3 / 4)/(this.timeVar))}</text>

                    <text textAnchor="end" x="32" y={this.props.height - 20}
                          fontSize="10px">{Math.floor(this.props.maxTimeInDays/ (this.timeVar)  )}</text>

                </g>

            </svg>

            </div>
            </div>
        );
    }
});
export default GlobalTimeAxis;

//<tspan x="39" dy="1em">(months)</tspan>
/*  <select className="dropdown">
                        <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            Dropdown button
                        </button>
                        <select className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                            <button>Month </button>
                            <button>Days </button>
                        </select>
                    </select>




                    <select className="dropdown">
                        
                            
                                <option>Month </option>
                                <option>Days </option>
                        
                        </select>
*/

/*


//in render

    const list = this.state.list;
        const{listOpen, headerTitle} = this.state;
//in return

            <div className="dd-wrapper">
            <div className="dd-header" onClick={() => this.toggleList()}>
                <div className="dd-header-title">{headerTitle}</div>
                {listOpen
                ? <FontAwesome name="angle-up" size="0.5x"/>
                : <FontAwesome name="angle-down" size="0.5x"/>
                }
            </div>
            {listOpen && <ul className="dd-list">
            {this.state.list.map((item) => (
                <li className="dd-list-item" key={item.id} >{item.title} </li>
                ))}
            </ul>}
            </div>



*/