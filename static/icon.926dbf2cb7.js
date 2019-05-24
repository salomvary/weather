import{wire}from'/static/esm.076a4de10f.js';const icons={'clear-day':'wi-day-sunny','clear-night':'wi-night-clear',rain:'wi-rain',snow:'wi-snow',sleet:'wi-sleet',wind:'wi-windy',fog:'wi-fog',cloudy:'wi-cloudy','partly-cloudy-day':'wi-day-cloudy','partly-cloudy-night':'wi-night-cloudy'};export default function Icon(i){return wire(i)`<i class=${['wi',icons[i.icon]||i.icon,i['class']].join(' ')}></i>`};