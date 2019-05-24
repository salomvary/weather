const maxFavoriteLocations=5,defaultState={location:{lat:52.51925,lon:13.40881,name:"Berlin",region:""},favoriteLocations:[],weather:null,screen:"loading",fetchError:!1,selectedDay:null};export default class Store{constructor(t=defaultState){this.state=Object.assign({},t),this.listeners=[]}loadSettings(t){Object.assign(this.state,t),this.notify()}loadWeather(t){this.state.fetchError=!1,this.state.weather=truncateWeather(t),this.notify()}failFetch(){this.state.fetchError=!0,this.notify()}navigate(t){this.state.screen=t,this.notify()}setLocation(t){this.state.location=t,this.notify()}toggleSelectedDay(t){this.state.weather&&this.state.weather.hourly.data.some(e=>e.time.getTime()>=t.getTime())&&(this.state.selectedDay&&+t==+this.state.selectedDay?this.state.selectedDay=null:this.state.selectedDay=t,this.notify())}addFavorite(t){this.state.favoriteLocations.some(e=>equalLocation(e,t))||(this.state.favoriteLocations.unshift(t),this.state.favoriteLocations.splice(maxFavoriteLocations)),this.notify()}notify(){this.listeners.forEach(t=>t())}subscribe(t){this.listeners.push(t)}}export function equalLocation(t,e){return t.lat===e.lat||t.lon===e.lon||t.name===e.name}function truncateWeather(t){const e=new Date,a=function({time:t}){return e.getTime()-t.getTime()<36e5},i=t.hourly.data.filter(a),s=t.daily.data.filter(function({time:t}){return e.getTime()-t.getTime()<864e5}),[o]=i;let n;return{currently:n=!a(t.currently)&&o?o:t.currently,hourly:{data:i},daily:{data:s}}}