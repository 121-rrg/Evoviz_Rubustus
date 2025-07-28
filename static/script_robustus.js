// Variable para almacenar la última InfoWindow abierta
let lastInfoWindow = null;

function createArrowIcon(direction) {
    return {
        path: "M0,-1 L-2,-3 L-1,-3 L-1,-8 L1,-8 L1,-3 L2,-3 Z",
        fillColor: "#FF0000",
        fillOpacity: 1,
        strokeColor: "#FFFFF", // Color del borde (debe coincidir con el color de la flecha si deseas que sea del mismo color)
        strokeOpacity: 1, // Opacidad del borde
        strokeWeight: 1, // Grosor del borde (ajustar según lo necesites)
        scale: 3,
        rotation: direction + 180, // Rotación según la dirección del viento
        anchor: new google.maps.Point(0, -4), // Ajusta el punto de anclaje de la flecha
    };
}

function CallupdateWindDirectionAndMarkers(SelectDate){
    console.log(SelectDate);

}

// Función para actualizar los datos y los marcadores
function updateWindDirectionAndMarkers(station, map, position, iconUrl, selectedDate = null) {
    // Definir las fechas predeterminadas
    const fechaInicioPredeterminada = new Date(2013, 2, 1); 
    const fechaFinPredeterminada = new Date(2017, 1, 28);

    // Verificar el estado del checkbox
    const visualizarTodo = document.getElementById('visualizar-todo').checked;

    // Si se proporciona una fecha seleccionada, usarla para sobrescribir el rango de fechas
    let fechaInicio, fechaFin;
    if (selectedDate) {
        fechaInicio = new Date(selectedDate);
        fechaFin = new Date(selectedDate);
    } else {
        fechaInicio = visualizarTodo 
            ? fechaInicioPredeterminada 
            : new Date(document.getElementById('fecha-inicio').value);
        fechaFin = visualizarTodo 
            ? fechaFinPredeterminada 
            : new Date(document.getElementById('fecha-fin').value);
    }

    // console.log('Fecha Inicio: ', fechaInicio);
    // console.log('Fecha Fin: ', fechaFin);

    // Filtrar los datos de la estación para el rango de fechas seleccionado
    const filteredData = station.data.filter(entry => {
        const entryDate = new Date(entry.year, entry.month - 1, entry.day);
        return entryDate >= fechaInicio && entryDate <= fechaFin;
    });

    // Calcular el promedio de la dirección del viento
    let totalWD = 0;
    let count = 0;
    filteredData.forEach(entry => {
        const wd = parseFloat(entry.wd);
        if (!isNaN(wd)) {
            totalWD += wd;
            count++;
        }
    });

    const averageWD = count > 0 ? totalWD / count : 0; // Promedio de la dirección del viento
    // console.log('Promedio de Dirección del Viento: ', averageWD);

    // Eliminar los marcadores previos de la estación (si existen)
    if (station.marker) {
        station.marker.setMap(null);
        station.arrowMarker.setMap(null);
    }

    // Crear un nuevo marcador para la estación
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(25, 25)
        }
    });

    // Crear el marcador de la flecha
    const arrowPosition = {
        lat: position.lat + 0.03, // Sin cambiar latitud
        lng: position.lng - 0.0, // Ajuste en la longitud
    };

    const arrowMarker = new google.maps.Marker({
        position: arrowPosition,
        map: map,
        icon: createArrowIcon(averageWD), // Usamos el promedio calculado
    });

    // Asociar eventos al nuevo marcador
    const infoWindow = new google.maps.InfoWindow();
    marker.addListener("click", () => {
        updateInfoWindowContent(infoWindow, station, map, marker);
    });

    // Asociar eventos de tooltip al nuevo marcador
    const tooltipDiv = document.createElement('div');
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.background = '#ffffff';
    tooltipDiv.style.color = '#333';
    tooltipDiv.style.border = '1px solid #ccc';
    tooltipDiv.style.borderRadius = '5px';
    tooltipDiv.style.padding = '5px 10px';
    tooltipDiv.style.fontSize = '12px';
    tooltipDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    tooltipDiv.style.display = 'none'; // Inicialmente oculto
    document.body.appendChild(tooltipDiv);

    marker.addListener("mouseover", (e) => {
        tooltipDiv.style.display = 'block';
        tooltipDiv.innerHTML = `<strong>${station.stationId.charAt(0).toUpperCase() + station.stationId.slice(1)}</strong>`;
        tooltipDiv.style.left = `${e.domEvent.pageX + 10}px`;
        tooltipDiv.style.top = `${e.domEvent.pageY + 10}px`;
    });

    marker.addListener("mousemove", (e) => {
        tooltipDiv.style.left = `${e.domEvent.pageX + 10}px`;
        tooltipDiv.style.top = `${e.domEvent.pageY + 10}px`;
    });

    marker.addListener("mouseout", () => {
        tooltipDiv.style.display = 'none';
    });

    // Asociar los nuevos marcadores con la estación
    station.marker = marker;
    station.arrowMarker = arrowMarker;
    station.infoWindow = infoWindow; // Guardar referencia al InfoWindow
}



// Función para inicializar el mapa de Beijing con Google Maps
function initMap() {
    // Establecer fechas aleatorias por defecto
    const randomDate = new Date(2013, 2, 1);  // Fecha inicial
    const endDate = new Date(2017, 1, 28);   // Fecha final
    const timeRange = endDate.getTime() - randomDate.getTime();
    const randomTime = Math.random() * timeRange;
    const selectedDate = new Date(randomDate.getTime() + randomTime);
    
    // Formatear las fechas para los inputs
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Establecer fechas por defecto en los inputs
    document.getElementById('fecha-inicio').value = formatDate(selectedDate);
    document.getElementById('fecha-fin').value = formatDate(new Date(selectedDate.getTime() + (300 * 24 * 60 * 60 * 1000))); // 7 días después
    
    const beijing = { lat: 40.3, lng: 116.5074 }; // Coordenadas de Beijing
    
    // Definir estilos personalizados para ocultar carreteras y otros elementos
    const mapStyles = [
        { featureType: "road", elementType: "geometry", stylers: [{ visibility: "on" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ visibility: "on" }] },
        { featureType: "poi", elementType: "all", stylers: [{ visibility: "on" }] },
        { featureType: "landscape", elementType: "labels", stylers: [{ visibility: "on" }] },
        { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "on" }] },
        { featureType: "water", elementType: "labels", stylers: [{ visibility: "on" }] }
    ];
    
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 8,
        center: beijing,
        styles: mapStyles,
        disableDefaultUI: false,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false
    });

    const stationsByCity = {};

    // Cargar y procesar el GeoJSON para los distritos
    fetch('map/beijing.json')
        .then(response => response.json())
        .then(data => {
            data.features.forEach(feature => {
                const district = new google.maps.Polygon({
                    paths: feature.geometry.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] })),
                    strokeColor: "#000000",
                    strokeOpacity: 0.5,
                    strokeWeight: 1.5,
                    fillColor: "#000000",
                    fillOpacity: 0.05,
                });
                district.setMap(map);
            });
        })
        .catch(error => {
            console.error("Error al cargar el GeoJSON:", error);
        });

    fetch('data/Data_Map_AQI_Day.csv')
        .then(response => response.text())
        .then(csvData => {
            const lines = csvData.split('\n');
            const headers = lines[0].split(',');
            const stationIdIndex = headers.indexOf('stationId');
            const latitudeIndex = headers.indexOf('latitude');
            const longitudeIndex = headers.indexOf('longitude');
            const yearIndex = headers.indexOf('year');
            const monthIndex = headers.indexOf('month');
            const dayIndex = headers.indexOf('day');
            const aqiIndex = headers.indexOf('AQI');
            const notesIndex = headers.indexOf('Notes');
            
            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                return {
                    stationId: values[stationIdIndex],
                    latitude: parseFloat(values[latitudeIndex]),
                    longitude: parseFloat(values[longitudeIndex]),
                    year: parseInt(values[yearIndex]),
                    month: parseInt(values[monthIndex]),
                    day: parseInt(values[dayIndex]),
                    AQI: parseFloat(values[aqiIndex]),
                    Notes: values[notesIndex]
                };
            }).filter(row => !isNaN(row.AQI));
    
            const calculateAverageAQI = () => {
                let fechaInicio = new Date(2013, 2, 1);
                let fechaFin = new Date(2017, 1, 28);
    
                if (document.getElementById('visualizar-todo').checked) {
                    fechaInicio = new Date(2013, 2, 1);
                    fechaFin = new Date(2017, 1, 28);
                } else {
                    const userFechaInicio = new Date(document.getElementById('fecha-inicio').value);
                    const userFechaFin = new Date(document.getElementById('fecha-fin').value);
                    userFechaInicio.setDate(userFechaInicio.getDate() + 1);
    
                    if (!isNaN(userFechaInicio) && !isNaN(userFechaFin)) {
                        fechaInicio = userFechaInicio;
                        fechaFin = userFechaFin;
                    }
                }
    
                const filteredData = data.filter(row => {
                    const rowDate = new Date(row.year, row.month - 1, row.day);
                    return rowDate >= fechaInicio && rowDate <= fechaFin;
                });
    
                const aqiByStation = {};
                filteredData.forEach(row => {
                    if (!aqiByStation[row.stationId]) {
                        aqiByStation[row.stationId] = { sum: 0, count: 0 };
                    }
                    aqiByStation[row.stationId].sum += row.AQI;
                    aqiByStation[row.stationId].count += 1;
                });
    
                // console.log("Promedio de AQI por estación:");
                // Object.entries(aqiByStation).forEach(([stationId, { sum, count }]) => {
                //     const avgAQI = count > 0 ? (sum / count).toFixed(2) : "Sin datos";
                //     console.log(`Estación: ${stationId} | Rango: ${fechaInicio.toDateString()} - ${fechaFin.toDateString()} | AQI Promedio: ${avgAQI}`);
                // });
    
                updateMarkers(aqiByStation);
            };
    
            const updateMarkers = (aqiByStation) => {
                stations.forEach(station => {
                    const stationAQI = aqiByStation[station.stationId];
                    const averageAQI = stationAQI && stationAQI.count > 0 ? (stationAQI.sum / stationAQI.count).toFixed(2) : 0;
                    const iconUrl = createCustomIcon(station.Notes, parseFloat(averageAQI));
                    updateWindDirectionAndMarkers(station, map, { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) }, iconUrl);
                });
            };
    
            document.getElementById('fecha-inicio').addEventListener('change', calculateAverageAQI);
            document.getElementById('fecha-fin').addEventListener('change', calculateAverageAQI);
            document.getElementById('visualizar-todo').addEventListener('change', calculateAverageAQI);
    
            const stations = parseCSV(csvData);
            calculateAverageAQI();
    
            // Llenar stationsByCity con las estaciones correspondientes
            stations.forEach(station => {
                if (!stationsByCity[station.Notes]) {
                    stationsByCity[station.Notes] = [];
                }
                stationsByCity[station.Notes].push(station);
            });

            // Asignar stationsByCity al mapa
            map.stationsByCity = stationsByCity;

            // Evento para seleccionar ciudad y actualizar la cámara del mapa
            const cityCheckboxes = document.querySelectorAll('input[name="city"]');
            cityCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    if (lastInfoWindow) {
                        lastInfoWindow.close();
                    }
    
                    const selectedCity = checkbox.value;
                    const stations = map.stationsByCity[selectedCity];
    
                    if (stations) {
                        const { marker, infoWindow } = stations[0];
                        updateInfoWindowContent(infoWindow, stations[0], map, marker);
                    }
    
                    const lat = parseFloat(checkbox.getAttribute('data-lat'));
                    const lng = parseFloat(checkbox.getAttribute('data-lng'));
    
                    // Ajuste dinámico de la cámara
                    if (!isNaN(lat) && !isNaN(lng)) {
                        map.setCenter({ lat, lng });
                        map.setZoom(12); // Ajustar nivel de zoom
                    } else {
                        console.error('No se pudo obtener la ubicación de la ciudad');
                    }
                });
            });
        })
        .catch(error => {
            console.error("Error al cargar el archivo CSV:", error);
        });
}

let  ColorAqiglobal = null;


function getWindDirectionText(degrees) {
    if (degrees >= 337.5 || degrees < 22.5) return "N (North)";
    if (degrees >= 22.5 && degrees < 45) return "NNE (North-Northeast)";
    if (degrees >= 45 && degrees < 67.5) return "NE (Northeast)";
    if (degrees >= 67.5 && degrees < 90) return "ENE (East-Northeast)";
    if (degrees >= 90 && degrees < 112.5) return "E (East)";
    if (degrees >= 112.5 && degrees < 135) return "ESE (East-Southeast)";
    if (degrees >= 135 && degrees < 157.5) return "SE (Southeast)";
    if (degrees >= 157.5 && degrees < 180) return "SSE (South-Southeast)";
    if (degrees >= 180 && degrees < 202.5) return "S (South)";
    if (degrees >= 202.5 && degrees < 225) return "SSW (South-Southwest)";
    if (degrees >= 225 && degrees < 247.5) return "SW (Southwest)";
    if (degrees >= 247.5 && degrees < 270) return "WSW (West-Southwest)";
    if (degrees >= 270 && degrees < 292.5) return "W (West)";
    if (degrees >= 292.5 && degrees < 315) return "WNW (West-Northwest)";
    if (degrees >= 315 && degrees < 337.5) return "NW (Northwest)";
    return "NNW (North-Northwest)";
}

function updateInfoWindowContent(infoWindow, station, map, marker) {
    // Definir las fechas predeterminadas
    const fechaInicioPredeterminada = new Date(2013, 2, 1); 
    const fechaFinPredeterminada = new Date(2017, 1, 28);

    // Verificar el estado del checkbox
    const visualizarTodo = document.getElementById('visualizar-todo').checked;

    // Obtener las fechas seleccionadas o las predeterminadas
    const fechaInicio = visualizarTodo 
        ? fechaInicioPredeterminada 
        : new Date(document.getElementById('fecha-inicio').value);
    const fechaFin = visualizarTodo 
        ? fechaFinPredeterminada 
        : new Date(document.getElementById('fecha-fin').value);

    // Ajustar las fechas (si es necesario)
    fechaInicio.setDate(fechaInicio.getDate() + 1);
    fechaFin.setDate(fechaFin.getDate());

    // Calcular los promedios
    const { averageAQI, averageWSPM, averageWD } = calculateAverages(
        station, 
        fechaInicio.toISOString().split('T')[0], 
        fechaFin.toISOString().split('T')[0]
    );

    // Convertir la dirección del viento en grados a formato de texto
    const windDirectionText = getWindDirectionText(averageWD);
    
    // Formatear las fechas
    const formatDate = (date) => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    };

    const content = `
    <div style="font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 8px 10px; max-width:180px; margin-top:-10px; max-height: 200px; line-height: 1.4; border-radius: 5px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">
        <strong style="font-size: 14px; color: #1a73e8; display: block; margin-bottom: 5px;">${station.stationId.charAt(0).toUpperCase() + station.stationId.slice(1)}</strong>
        <p style="margin: 3px 0;">
            <strong>AQI:</strong> 
            <span style="background-color: ${averageAQI >= 0 && averageAQI <= 1.5 ? '#00e400' : averageAQI > 1.5 && averageAQI <= 2.5 ? '#ff0' : averageAQI > 2.5 && averageAQI <= 3.5 ? '#ff7e00' : averageAQI > 3.5 && averageAQI <= 4.5 ? '#f00' : averageAQI > 4.5 && averageAQI <= 5 ? '#99004c' : '#7e0023'}; color: #000; padding: 2px 5px; border-radius: 5px;">
                ${Math.round(averageAQI)}
            </span>
        </p>
        <p style="margin: 3px 0;"><strong>Velocidad del viento:</strong> ${averageWSPM.toFixed(2)} m/s</p>
        <p style="margin: 3px 0;">
            <strong>Dirección del viento:</strong> ${averageWD}° (${windDirectionText})
        </p>
        <p style="margin: 3px 0;"><strong>Zona:</strong> ${station.Notes}</p>
        <p style="margin: 3px 0;"><strong>Fecha Inicio:</strong> ${formatDate(fechaInicio)}</p>
        <p style="margin: 3px 0;"><strong>Fecha Fin:</strong> ${formatDate(fechaFin)}</p>
    </div>`;
    ColorAqiglobal = averageAQI;
    selectCityCheckbox(station.stationId);
    infoWindow.setContent(content);
    openInfoWindow(map, marker, infoWindow);
}


function selectCityCheckbox(city) {
    const newCity = `Data_${city.charAt(0).toUpperCase() + city.slice(1)}.csv`;
    // console.log(newCity);
    const checkbox = document.querySelector(`input[name="city"][value="${newCity}"]`);
    if (checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
    }
}

// Función para calcular los promedios de AQI, WSPM y WD en un rango de fechas
function calculateAverages(station, fechaInicio, fechaFin) {
    if (!station.data) return { averageAQI: 0, averageWSPM: 0, averageWD: 0 };

    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    let totalAQI = 0;
    let totalWSPM = 0;
    let totalWD = 0;
    let count = 0;

    station.data.forEach(entry => {
        const entryDate = new Date(entry.year, entry.month - 1, entry.day);
        if (entryDate >= startDate && entryDate <= endDate) {
            const aqi = parseFloat(entry.AQI);
            const wspm = parseFloat(entry.WSPM);
            const wd = entry.wd;

            if (!isNaN(aqi)) totalAQI += aqi;
            if (!isNaN(wspm)) totalWSPM += wspm;
            if (wd) totalWD = wd; // Assuming `wd` is categorical

            count++;
        }
    });

    return {
        averageAQI: count ? totalAQI / count : 0,
        averageWSPM: count ? totalWSPM / count : 0,
        averageWD: totalWD || "N/A"
    };
}
function createCustomIcon(category, averageAQI) {
    const color = averageAQI >= 0 && averageAQI <= 1.5 ? '#00e400' :
                  averageAQI > 1.5 && averageAQI <= 2.5 ? '#ff0' :
                  averageAQI > 2.5 && averageAQI <= 3.5 ? '#ff7e00' :
                  averageAQI > 3.5 && averageAQI <= 4.5 ? '#f00' :
                  averageAQI > 4.5 && averageAQI <= 5 ? '#99004c' :
                  '#7e0023';

    const svg = d3.create("svg")
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("viewBox", "0 0 100 100")
        .attr("width", "100")
        .attr("height", "100");

    if (category === "Urban") {
        svg.append("polygon")
            .attr("points", "50,20 75,80 25,80")
            .attr("fill", color)
            .attr("stroke", "black")
            .attr("stroke-width", 3);
    } else if (category === "Rural") {
        svg.append("rect")
            .attr("x", "20")
            .attr("y", "20")
            .attr("width", "40")
            .attr("height", "40")
            .attr("fill", color)
            .attr("stroke", "black")
            .attr("stroke-width", 3);
    } else if (category === "Cross Reference") {
        svg.append("polygon")
            .attr("points", "50,15 61,40 87,40 67,60 74,85 50,70 26,85 33,60 13,40 39,40")
            .attr("fill", color)
            .attr("stroke", "black")
            .attr("stroke-width", 3);
    }

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg.node().outerHTML);
}

// Escuchar cambios en el rango de fechas
document.getElementById('fecha-inicio').addEventListener('change', updateStationInfoWindows);
document.getElementById('fecha-fin').addEventListener('change', updateStationInfoWindows);
document.getElementById('visualizar-todo').addEventListener('change', updateStationInfoWindows);


function updateStationInfoWindows() {
    if (lastInfoWindow && lastInfoWindow.marker) {
        const marker = lastInfoWindow.marker;
        const station = marker.stationData;
        updateInfoWindowContent(lastInfoWindow, station, marker.map, marker);
    }
}

// Función para abrir InfoWindow y manejar el cierre de la anterior
function openInfoWindow(map, marker, infoWindow) {
    if (lastInfoWindow) {
        lastInfoWindow.close();
    }

    infoWindow.open(map, marker);
    lastInfoWindow = infoWindow;
    lastInfoWindow.marker = marker;
    map.setZoom(12);
    map.setCenter(marker.getPosition());
}
// Función para seleccionar el checkbox de la ciudad correspondiente
function selectCityCheckbox(city) {
    const newCity = `Data_${city.charAt(0).toUpperCase() + city.slice(1)}.csv`;
    // console.log(newCity);
    const checkbox = document.querySelector(`input[name="city"][value="${newCity}"]`);
    if (checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));

    }
}
// Función para parsear CSV a objetos organizados por estación
function parseCSV(data) {
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    const stations = {};

    for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(',');
        if (currentline.length === headers.length) {
            const entry = {};
            headers.forEach((header, index) => {
                entry[header.trim()] = currentline[index].trim();
            });

            const stationId = entry.stationId;
            if (!stations[stationId]) {
                stations[stationId] = {
                    stationId: stationId,
                    latitude: parseFloat(entry.latitude),
                    longitude: parseFloat(entry.longitude),
                    Notes: entry.Notes,
                    data: []
                };
            }
            stations[stationId].data.push(entry);
        }
    }

    return Object.values(stations);
}

///////////////GRAFICA  RADIAL DE SERIE TEMPORAL.


// Escuchar cambios en los checkboxes de ciudad para la gráfica radial
document.querySelectorAll('#city-checkboxes input[type="radio"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateChart);
});

// Escuchar cambios en los checkboxes 
document.querySelectorAll('.options-chek input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateChart);
});

// Escuchar cambios en el rango de fechas para la gráfica radial
document.getElementById('fecha-inicio').addEventListener('change', updateChart);
document.getElementById('fecha-fin').addEventListener('change', updateChart);

document.getElementById('visualizar-todo').addEventListener('change', function () {
    const isChecked = this.checked;
    document.getElementById('fecha-inicio').disabled = isChecked;
    document.getElementById('fecha-fin').disabled = isChecked;
    updateChart();
    document.getElementById('fecha-rango').innerText = isChecked ? "Visualizando todos los datos." : "";


});

// Asegúrate de que el estado del checkbox se refleje correctamente al cargar la página
document.getElementById('visualizar-todo').checked = true; // Marca el checkbox
document.getElementById('visualizar-todo').dispatchEvent(new Event('change')); // Llama al evento para aplicar los cambios


// Modificar la función updateChart para la gráfica radial
function updateChart() {
    const selectedCities = Array.from(document.querySelectorAll('#city-checkboxes input[type="radio"]:checked'))
                                .map(cb => cb.value);
    const selectedAttributes = Array.from(document.querySelectorAll('.options-chek input[type="checkbox"]:checked'))
                                   .map(cb => cb.value);

    const startDate = document.getElementById('fecha-inicio').value;
    const endDate = document.getElementById('fecha-fin').value;

    if (selectedCities.length === 0 || selectedAttributes.length === 0) return;

    selectedCities.forEach(selectedCity => {
        d3.csv(`data/${selectedCity}`).then(data => {
            const visualizarTodo = document.getElementById('visualizar-todo').checked;
            if (!visualizarTodo && startDate && endDate) {
                data = data.filter(d => {
                    const date = new Date(`${d.year}-${d.month}-${d.day}`);
                    return date >= new Date(startDate) && date <= new Date(endDate);
                });
            }

            const parsedData = d3.groups(data, d => `${d.year}-${d.month}-${d.day}`).map(([date, entries]) => {
                const avg = {};
                selectedAttributes.forEach(attr => {
                    const values = entries.map(d => +d[attr.replace('.', '_')]).filter(v => !isNaN(v));
                    avg[attr] = values.length > 0 ? d3.mean(values) : 0;
                });
                avg.date = date;
                avg.year = entries[0].year;
                avg.month = entries[0].month;
                avg.day = entries[0].day;
                return avg;
            });

            drawRadialChart(parsedData, selectedAttributes);
        });
    });
}
// Colores definidos para cada atributo
const attributeColors = {
    'PM2_5': '#FF0000', // Rojo fuerte para reflejar peligro
    'PM10': '#FF9900', // Naranja brillante para particulado
    'SO2': '#FFD700', // Amarillo intenso para gases tóxicos
    'NO2': '#d500f1', // Verde neón para contaminación visible
    'CO': '#00CED1', // Turquesa vibrante para gas incoloro
    'O3': '#0000FF', // Azul intenso para ozono
    'TEMP': '#008000', // Rosa fuerte para variación térmica
    'PRES': '#8B0000', // Rojo oscuro para presión atmosférica
    'DEWP': '#4B0082', // Indigo para representar humedad
    'RAIN': '#1E90FF'  // Azul cielo para lluvia
};

function drawRadialChart(data, attributes) {
    d3.select('#chart-view-radial').html("");
    const width = 500;
    const height = 490;
    const radius = Math.min(width, height) / 2 - 40;

    // Crear el SVG y el grupo principal
    const svg = d3.select('#chart-view-radial')
                  .append('svg')
                  .attr('width', width)
                  .attr('height', height);

    const chartGroup = svg.append('g')
                          .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Escala para los ángulos
    const angleScale = d3.scaleLinear().domain([0, data.length]).range([0, -2 * Math.PI]);

    // Obtener los valores máximos de cada atributo
    const maxValues = attributes.map(attr => d3.max(data, d => d[attr]));
    const centralHoleRadius = 30;
    const ringWidth = (radius - centralHoleRadius) / attributes.length;

    // Definir los colores para las estaciones
    const seasonColors = {
        'Spring': '#2ca25f',
        'Summer': '#d95f0e',
        'Autumn': '#7570b3',
        'Winter': '#1f78b4',
        'YearRound': '#6a3d9a'
    };

    // Función para obtener la estación en base a la fecha
    function getSeason(month, day) {
        if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day <= 21)) {
            return 'Spring';
        } else if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day <= 22)) {
            return 'Summer';
        } else if ((month === 9 && day >= 22) || (month > 9 && month < 12) || (month === 12 && day <= 21)) {
            return 'Autumn';
        } else {
            return 'Winter';
        }
    }

    attributes.forEach((attr, index) => {
        const radialScale = d3.scaleLinear().domain([0, maxValues[index]]).range([centralHoleRadius + index * ringWidth, centralHoleRadius + (index + 1) * ringWidth]);

        chartGroup.append("circle").attr("cx", 0).attr("cy", 0)
                  .attr("r", radialScale(maxValues[index])).attr("fill", "none")
                  .attr("stroke", "#000").attr("stroke-width", 1)
                  .attr("stroke-dasharray", "3,3");

        const line = d3.lineRadial()
                      .angle((d, j) => angleScale(j))
                      .radius(d => radialScale(d[attr]) || 0);

        // Color para la línea
        const lineColor = attributeColors[attr] || '#000';  // Si no está definido, asigna un color por defecto

        chartGroup.append('path').datum(data)
                  .attr('fill', 'none')
                  .attr('stroke', lineColor)
                  .attr('stroke-width', 1.5)
                  .attr('d', line);

        chartGroup.append('text')
                  .attr('x', 0)
                  .attr('y', -radialScale(maxValues[index]) - 10)
                  .attr('dy', '-0.5em')
                  .attr('text-anchor', 'middle')
                  .attr('font-size', '14px')
                  .attr('font-weight', 'bold')
                  .text(attr);

        data.forEach((d, i) => {
            const season = getSeason(+d.month, +d.day);
            const seasonColor = seasonColors[season];
            const startAngle = angleScale(i);
            const endAngle = angleScale(i + 1);
            const pathArc = d3.arc()
                              .innerRadius(centralHoleRadius + index * ringWidth)
                              .outerRadius(radialScale(maxValues[index]))
                              .startAngle(startAngle)
                              .endAngle(endAngle);

            chartGroup.append('path')
                      .attr('d', pathArc)
                      .attr('fill', seasonColor)
                      .attr('opacity', 0.3);
        });
    });

    // // Funcionalidad de zoom
    // const zoom = d3.zoom()
    //               .scaleExtent([0.5, 5])  // Rango de escala permitido
    //               .on('zoom', (event) => {
    //                   chartGroup.attr('transform', event.transform);
    //               });

    // svg.call(zoom);  // Aplica el zoom al SVG

    // Agregar etiquetas dinámicas de tiempo (meses o días)
    const timeSpan = (new Date(data[data.length - 1].date) - new Date(data[0].date)) / (1000 * 60 * 60 * 24);
    const isMonthly = timeSpan > 30;
    const isYearly = timeSpan > 365;

    const displayedLabels = new Set();  // Para evitar etiquetas repetidas

    data.forEach((d, i) => {
        const angle = angleScale(i);
        const x = Math.sin(angle) * (radius + 10);
        const y = -Math.cos(angle) * (radius + 10);

        let label;
        let labelKey;
        if (isYearly) {
            label = d3.timeFormat('%Y')(new Date(d.date));
            labelKey = `year-${label}`;
        } else if (isMonthly) {
            label = d3.timeFormat('%b')(new Date(d.date)); // Mes
            labelKey = `month-${label}`;
        } else {
            label = d3.timeFormat('%d %b')(new Date(d.date)); // Día y Mes
            labelKey = `day-${label}`;
        }

        // Mostrar solo si la etiqueta aún no se ha agregado
        if (!displayedLabels.has(labelKey)) {
            chartGroup.append('text')
                      .attr('x', x)
                      .attr('y', y)
                      .attr('dy', '0.35em')
                      .attr('text-anchor', 'middle')
                      .attr('font-size', '10px')
                      .text(label);
            displayedLabels.add(labelKey);  // Marca la etiqueta como mostrada
        }
    });
}


// GRAFICAS PAR RADIAL PERO QUE SEA POR LA SELECCION DEL UMAPO

function updateRadialChartWithSelection(selectionData, fechaInicio, fechaFin) {
    if (selectionData.length === 0) return;

    const selectedCity = selectionData[0].city; // Nombre de la ciudad seleccionada
    const selectedDates = selectionData.map(d => `${d.year}-${d.month}-${d.day}`); // Fechas seleccionadas

    d3.csv(`data/${selectedCity}`).then(data => {
        // Filtrar los datos por las fechas seleccionadas
        const filteredData = data.filter(d => {
            const dateStr = `${d.year}-${d.month}-${d.day}`;
            return selectedDates.includes(dateStr);
        });

        // Agrupar y calcular promedio por atributo
        const attributes = Array.from(document.querySelectorAll('.options-chek input[type="checkbox"]:checked'))
                                .map(cb => cb.value);

        const aggregatedData = d3.groups(filteredData, d => `${d.year}-${d.month}-${d.day}`).map(([date, entries]) => {
            const avg = {};
            attributes.forEach(attr => {
                const values = entries.map(d => +d[attr.replace('.', '_')]).filter(v => !isNaN(v));
                avg[attr] = values.length > 0 ? d3.mean(values) : 0;
            });
            avg.date = date;
            return avg;
        });

        // Llamar a la nueva función para dibujar la gráfica radial
        drawRadialChart2(aggregatedData, attributes, fechaInicio, fechaFin);
        
    });
}


function drawRadialChart2(data, attributes, fechaInicio, fechaFin) {
    
    d3.select('#chart-view-radial').html("");
    const width = 500;
    const height = 490;
    const radius = Math.min(width, height) / 2 - 40;
    const svg = d3.select('#chart-view-radial')
                  .append('svg')
                  .attr('width', width)
                  .attr('height', height)
                  .append('g')
                  .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const centralHoleRadius = 30;
    const ringWidth = (radius - centralHoleRadius) / attributes.length;

    // Tooltip para mostrar información
    const tooltip = d3.select("body").append("div")
                      .style("position", "absolute")
                      .style("background", "#f9f9f9")
                      .style("padding", "10px")
                      .style("border", "1px solid #ccc")
                      .style("border-radius", "5px")
                      .style("box-shadow", "0px 0px 10px rgba(0, 0, 0, 0.1)")
                      .style("display", "none")
                      .style("pointer-events", "none")
                      .style("font-size", "12px");

    const seasonColors = {
        'Spring': '#2ca25f',
        'Summer': '#d95f0e',
        'Autumn': '#7570b3',
        'Winter': '#1f78b4',
        'YearRound': '#6a3d9a'
    };

    const attributeColors = {
        'PM2_5': '#FF0000', // Rojo fuerte para reflejar peligro
        'PM10': '#FF9900', // Naranja brillante para particulado
        'SO2': '#FFD700', // Amarillo intenso para gases tóxicos
        'NO2': '#d500f1', // Verde neón para contaminación visible
        'CO': '#00CED1', // Turquesa vibrante para gas incoloro
        'O3': '#0000FF', // Azul intenso para ozono
        'TEMP': '#008000', // Verde para variación térmica
        'PRES': '#8B0000', // Rojo oscuro para presión atmosférica
        'DEWP': '#4B0082', // Indigo para representar humedad
        'RAIN': '#1E90FF'  // Azul cielo para lluvia
    };

    // Obtener rango completo de fechas
    const dateExtent = d3.extent(data, d => new Date(d.date));
    const fullDateRange = d3.timeDay.range(dateExtent[0], d3.timeDay.offset(dateExtent[1], 1));

    // Escala angular para cubrir todas las fechas
    const angleScale = d3.scaleTime().domain(dateExtent).range([0, -2 * Math.PI]);

    // Dibujar fondo por estaciones
    const generateSeasonRanges = (year) => [
        { season: 'Spring', start: new Date(year, 2, 20), end: new Date(year, 5, 21) },
        { season: 'Summer', start: new Date(year, 5, 21), end: new Date(year, 8, 22) },
        { season: 'Autumn', start: new Date(year, 8, 23), end: new Date(year, 11, 21) },
        { season: 'Winter', start: new Date(year, 11, 21), end: new Date(year + 1, 2, 20) }
    ];

    const allSeasonRanges = [];
    for (let year = dateExtent[0].getFullYear() - 1; year <= dateExtent[1].getFullYear() + 1; year++) {
        allSeasonRanges.push(...generateSeasonRanges(year));
    }

    allSeasonRanges.forEach(({ season, start, end }) => {
        if (start < dateExtent[0]) start = dateExtent[0];
        if (end > dateExtent[1]) end = dateExtent[1];
        if (start >= end) return;

        const startAngle = angleScale(start);
        const endAngle = angleScale(end);

        svg.append('path')
           .attr('d', d3.arc()
               .innerRadius(centralHoleRadius)
               .outerRadius(radius)
               .startAngle(startAngle)
               .endAngle(endAngle))
           .attr('fill', seasonColors[season])
           .attr('opacity', 0.3)
           .attr('class', `season-${season.replace(/\s+/g, '-')}`) // Clase específica para la estación
           .on("click", function(event) {
                const clickedSeason = season;
                const selectedDates = data.filter(d => getSeason(new Date(d.date)) === clickedSeason)
                    .map(d => d.date);
                
                // Verificar si hay fechas seleccionadas
                if (selectedDates.length === 0) {
                    // console.log(`No hay datos para la estación ${clickedSeason}.`);
                    return; // No hacer nada si no hay datos
                }

                // console.log(`Fechas en la estación ${clickedSeason}:`, selectedDates);

                // Limpiar selecciones previas
                svg.selectAll('path').classed('selected', false);

                // Resaltar la selección
                svg.selectAll(`.season-${clickedSeason.replace(/\s+/g, '-')}`).classed('selected', true);

                // Obtener la ciudad seleccionada
                const selectedCity = document.querySelector('#city-checkboxes input[type="radio"]:checked').value;

                // Actualizar la gráfica de series temporales con las fechas seleccionadas
                updateTimeSeriesChart(selectedCity, fechaInicio , fechaFin, selectedDates);
                // console.log(selectedDates)
                updateCorrelationMatrixnew(selectedDates);
                drawThemeRiver(selectedCity, selectedDates); // Riverplot basado en fechas
                // plotUMAP(filteredData, fechaInicio, fechaFin); // UMAP con datos filtrados
                
                // console.log("datos",selectedData)
                console.log("Fecha incio",fechaInicio)
                console.log("fecha fin", fechaFin)

                
           });
    });

    // Agregar líneas de corte en el 31 de diciembre de cada año
    const years = d3.timeYear.range(dateExtent[0], d3.timeYear.offset(dateExtent[1], 1));
    years.forEach(year => {
        const dec31 = new Date(year, 11, 31);
        const dec31Angle = angleScale(dec31);

        svg.append('line')
           .attr('x1', Math.sin(dec31Angle) * centralHoleRadius)
           .attr('y1', -Math.cos(dec31Angle) * centralHoleRadius)
           .attr('x2', Math.sin(dec31Angle) * radius)
           .attr('y2', -Math.cos(dec31Angle) * radius)
           .attr('stroke', '#000')
           .attr('stroke-width', 2)
           .attr('stroke-dasharray', '4,4');
    });

    // Obtener valores máximos por atributo
    const maxValues = attributes.map(attr => d3.max(data, d => d[attr]));

    attributes.forEach((attr, index) => {
        const radialScale = d3.scaleLinear().domain([0, maxValues[index]]).range([centralHoleRadius + index * ringWidth, centralHoleRadius + (index + 1) * ringWidth]);

        // Círculos de referencia
        svg.append("circle")
           .attr("cx", 0).attr("cy", 0)
           .attr("r", radialScale(maxValues[index]))
           .attr("fill", "none")
           .attr("stroke", "#000")
           .attr("stroke-width", 1)
           .attr("stroke-dasharray", "3,3");

        // Dibujar datos
        let previousDate = null;
        data.forEach((d, i) => {
            const date = new Date(d.date);
            const angle = angleScale(date);
            const value = d[attr] || 0;
            const radiusValue = radialScale(value);

            const x = Math.sin(angle) * radiusValue;
            const y = -Math.cos(angle) * radiusValue;

            svg.append('circle')
               .attr('cx', x)
               .attr('cy', y)
               .attr('r', 1.5) // Puntos más pequeños
               .attr('fill', attributeColors[attr])
               .on("mouseover", () => {
                   tooltip.style("display", "block")
                          .html(`<strong>Fecha:</strong> ${d3.timeFormat('%d/%m/%Y')(date)}<br><strong>${attr}:</strong> ${value.toFixed(2)}`);
               })
               .on("mousemove", (event) => {
                   tooltip.style("left", (event.pageX + 10) + "px")
                          .style("top", (event.pageY - 20) + "px");
               })
               .on("mouseout", () => {
                   tooltip.style("display", "none");
               });

            // Unir puntos si las fechas son consecutivas
            if (previousDate) {
                const diffDays = (date - previousDate) / (1000 * 60 * 60 * 24);
                if (diffDays === 1) {
                    const prevValue = data[i - 1][attr] || 0;
                    const prevRadius = radialScale(prevValue);
                    const prevAngle = angleScale(previousDate);
                    const prevX = Math.sin(prevAngle) * prevRadius;
                    const prevY = -Math.cos(prevAngle) * prevRadius;

                    svg.append('line')
                       .attr('x1', prevX)
                       .attr('y1', prevY)
                       .attr('x2', x)
                       .attr('y2', y)
                       .attr('stroke', attributeColors[attr])
                       .attr('stroke-width', 1);
                }
            }

            previousDate = date;
        });

        // Etiqueta del atributo
        svg.append('text')
           .attr('x', 0)
           .attr('y', -radialScale(maxValues[index]) - 10)
           .attr('dy', '-0.5em')
           .attr('text-anchor', 'middle')
           .attr('font-size', '14px')
           .attr('font-weight', 'bold')
           .text(attr);
    });

    // Etiquetas de fechas alrededor del gráfico
    fullDateRange.forEach((date, i) => {
        const angle = angleScale(date);
        const x = Math.sin(angle) * (radius + 10);
        const y = -Math.cos(angle) * (radius + 10);

        let label = '';
        if (i % Math.ceil(fullDateRange.length / 10) === 0) {
            label = d3.timeFormat('%b %Y')(date); // Mes y año
        }
        svg.append('text')
           .attr('x', x)
           .attr('y', y)
           .attr('dy', '0.35em')
           .attr('text-anchor', 'middle')
           .attr('font-size', '10px')
           .text(label);
    });

    // // Agregar la funcionalidad de zoom
    // const zoom = d3.zoom()
    //                .scaleExtent([0.5, 5])  // Definir el rango de zoom
    //                .on('zoom', function(event) {
    //                    svg.attr('transform', event.transform);  // Aplicar el zoom
    //                });

    // svg.call(zoom);  // Llamar a la función de zoom
}




function getSeason(date) {
    const month = date.getMonth(); // Get month (0-11)
    const day = date.getDate(); // Get day (1-31)
    
    if ((month === 2 && day >= 20) || (month > 2 && month < 5) || (month === 5 && day <= 21)) {
        return 'Spring';
    } else if ((month === 5 && day >= 21) || (month > 5 && month < 8) || (month === 8 && day <= 22)) {
        return 'Summer';
    } else if ((month === 8 && day >= 23) || (month > 8 && month < 11) || (month === 11 && day <= 21)) {
        return 'Autumn';
    } else {
        return 'Winter';
    }
}



///////////////////////////////////////////////
// Funciones para la matriz de correlación

// Escuchar cambios en los radio buttons de ciudades
document.querySelectorAll('#city-checkboxes input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', updateCorrelationMatrix);
});

// Escuchar cambios en los checkboxes de atributos dentro de .options-chek-correlation
document.querySelectorAll('.options-chek-correlation input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateCorrelationMatrix);
});

// Escuchar cambios en el rango de fechas
document.getElementById('fecha-inicio').addEventListener('change', updateCorrelationMatrix);
document.getElementById('fecha-fin').addEventListener('change', updateCorrelationMatrix);
// Función para calcular la matriz de correlación
function calculateCorrelationMatrix(data, selectedAttributes) {
    const matrix = [];

    // Normalizar los datos
    const normalizedData = normalizeData(data, selectedAttributes);

    // Iterar sobre cada par de atributos seleccionados
    for (let i = 0; i < selectedAttributes.length; i++) {
        const row = [];
        for (let j = 0; j < selectedAttributes.length; j++) {
            if (i === j) {
                row.push(1); // Correlación perfecta de un atributo consigo mismo
            } else {
                row.push(calculateCorrelation(normalizedData, selectedAttributes[i], selectedAttributes[j]));
            }
        }
        matrix.push(row);
    }

    return matrix;
}

// Función para normalizar los datos (z-score)
function normalizeData(data, selectedAttributes) {
    const means = {};
    const stdDevs = {};

    // Calcular media y desviación estándar para cada atributo
    selectedAttributes.forEach(attr => {
        const values = data.map(d => +d[attr]); // Convertir a números
        const mean = d3.mean(values);
        const stdDev = Math.sqrt(d3.mean(values.map(v => Math.pow(v - mean, 2)))); // Desviación estándar
        means[attr] = mean;
        stdDevs[attr] = stdDev;
    });

    // Normalizar cada registro
    return data.map(d => {
        const normalizedEntry = {};
        selectedAttributes.forEach(attr => {
            const mean = means[attr];
            const stdDev = stdDevs[attr];
            // Evitar divisiones por cero si la desviación estándar es 0
            normalizedEntry[attr] = stdDev === 0 ? 0 : (+d[attr] - mean) / stdDev;
        });
        return normalizedEntry;
    });
}

// Función para calcular la correlación entre dos atributos en los datos normalizados
function calculateCorrelation(data, attr1, attr2) {
    const n = data.length;

    // Manejar casos con menos de 2 registros
    if (n < 2) return 0;

    const mean1 = d3.mean(data, d => d[attr1]);
    const mean2 = d3.mean(data, d => d[attr2]);
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    data.forEach(d => {
        const x = d[attr1] - mean1;
        const y = d[attr2] - mean2;
        numerator += x * y;
        denominator1 += x * x;
        denominator2 += y * y;
    });

    // Evitar divisiones por cero si los denominadores son 0
    if (denominator1 === 0 || denominator2 === 0) return 0;

    return numerator / Math.sqrt(denominator1 * denominator2);
}

// Función para calcular la matriz de distancias (de acuerdo a la correlación)
function calculateDistanceMatrix(correlationMatrix) {
    const numAttributes = correlationMatrix.length;
    const distanceMatrix = Array.from({ length: numAttributes }, () => Array(numAttributes).fill(0));

    for (let i = 0; i < numAttributes; i++) {
        for (let j = 0; j < numAttributes; j++) {
            // Convertir correlación a distancia usando la fórmula (1 - correlación)
            distanceMatrix[i][j] = Math.sqrt(2 * (1 - correlationMatrix[i][j]));
        }
    }

    return distanceMatrix;
}
function updateCorrelationMatrix() {
    const selectedAttributes = Array.from(document.querySelectorAll('.options-chek-correlation input[type="checkbox"]:checked'))
                                   .map(cb => cb.value);

    if (selectedAttributes.length === 0) return;

    // Obtener las ciudades seleccionadas
    const selectedCities = Array.from(document.querySelectorAll('#city-checkboxes input[type="radio"]:checked'))
                                .map(cb => cb.value);

    // Verificar si "visualizar todo" está marcado
    const visualizarTodo = document.getElementById('visualizar-todo').checked;

    // Obtener el rango de fechas si "visualizar todo" no está seleccionado
    const startDate = document.getElementById('fecha-inicio').value;
    const endDate = document.getElementById('fecha-fin').value;

    selectedCities.forEach(selectedCity => {
        d3.csv(`data/${selectedCity}`).then(data => {
            // Filtrar los datos por fechas si "visualizar todo" no está seleccionado
            if (!visualizarTodo && startDate && endDate) {
                data = data.filter(d => {
                    const date = new Date(`${d.year}-${d.month}-${d.day}`);
                    return date >= new Date(startDate) && date <= new Date(endDate); // Incluir las fechas límite
                });
            }

            const parsedData = d3.groups(data, d => `${d.year}-${d.month}-${d.day} ${d.hour}`).map(([datetime, entries]) => {
                const avg = {};
                selectedAttributes.forEach(attr => {
                    const values = entries.map(d => +d[attr.replace('.', '_')]).filter(v => !isNaN(v));
                    avg[attr] = values.length > 0 ? d3.mean(values) : 0;
                });
                return avg;
            });

            console.log("DATOS DE LPARCER AL INICIAR", parsedData);

            const correlationMatrix = calculateCorrelationMatrix(parsedData, selectedAttributes);
            const matrizdistancia = calculateDistanceMatrix(correlationMatrix);
            const hierarchyData = buildHierarchy(selectedAttributes, matrizdistancia);

            // Crear o actualizar el dendrograma radial con los rangos de fecha y la ciudad
            createRadialDendrogram(hierarchyData, selectedAttributes, matrizdistancia, selectedCity, 
                visualizarTodo ? 'Todos los datos' : `${startDate} a ${endDate}`);
        });
    });
}


// Función para construir la jerarquía (usando la matriz de distancia)
function buildHierarchy(attributes, distanceMatrix) {
    let clusters = attributes.map((attr, i) => ({
        name: attr,
        index: i,
        points: [i],  // Cada clúster empieza con un solo punto
        children: []
    }));

    let n = clusters.length;

    while (n > 1) {
        let minAverageDistance = Infinity;
        let a, b;

        // Encontrar el par de clústeres con la menor distancia promedio
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                let sumDistance = 0;
                let count = 0;

                // Calcular la distancia promedio entre todos los pares de puntos en los clústeres i y j
                for (let pointI of clusters[i].points) {
                    for (let pointJ of clusters[j].points) {
                        sumDistance += distanceMatrix[pointI][pointJ];
                        count++;
                    }
                }

                const averageDistance = sumDistance / count;

                if (averageDistance < minAverageDistance) {
                    minAverageDistance = averageDistance;
                    a = i;
                    b = j;
                }
            }
        }

        // Crear un nuevo clúster combinando los clústeres a y b
        const newCluster = {
            name: clusters[a].name + '-' + clusters[b].name,
            distance: minAverageDistance,
            points: clusters[a].points.concat(clusters[b].points), // Unir puntos
            children: [clusters[a], clusters[b]]
        };

        // Actualizar la lista de clústeres
        clusters = clusters.filter((_, i) => i !== a && i !== b);
        clusters.push(newCluster);
        n--;
    }

    return clusters[0];  // Devolver la jerarquía final
}

function createRadialDendrogram(hierarchyData, selectedAttributes, distanceMatrix, selectedCity, dateRange) {
    // Verificar que los datos de entrada no sean undefined
    if (!hierarchyData || !selectedAttributes || !distanceMatrix || !selectedCity || !dateRange) {
        // console.error("Datos de entrada inválidos:", { hierarchyData, selectedAttributes, distanceMatrix, selectedCity, dateRange });
        return; // Salir de la función si los datos son inválidos
    }

    const width = 300;
    const height = 310;
    const clusterRadius = 90;

    const clusterLayout = d3.cluster().size([2 * Math.PI, clusterRadius]);

    const root = d3.hierarchy(hierarchyData);
    clusterLayout(root);

    // Configurar el gráfico
    const svg = d3.select('#chart-view-dendrogram')
                  .html('')  // Limpiar el contenedor antes de redibujar
                  .append('svg')
                  .attr('width', width)
                  .attr('height', height)
                  .append('g')
                  .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Crear el tooltip
    const tooltip = d3.select('body').append('div')
                      .attr('class', 'tooltip')
                      .style('position', 'absolute')
                      .style('visibility', 'hidden')
                      .style('background', 'rgba(0, 0, 0, 0.7)')
                      .style('color', 'white')
                      .style('padding', '5px')
                      .style('border-radius', '5px');

    // Definir la escala de color
    const colorScale = d3.scaleLinear()
                         .domain([0, d3.max(distanceMatrix.flat())]) // Rango de 0 a la distancia máxima
                         .range(['red', 'blue']); // De rojo a azul

    // Dibujar los enlaces como líneas, sin áreas
    svg.selectAll('.link')
        .data(root.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y))
        .style('fill', 'none') // Eliminar área
        .style('stroke', d => {
            const attribute = d.target.data.name;
            return attribute && isMeteorologicalAttribute(attribute) ? 'blue' : '#ccc'; // Color azul para meteorología
        })
        .style('stroke-width', d => {
            const attribute = d.target.data.name;
            return attribute && isMeteorologicalAttribute(attribute) ? 2 : 1; // Grosor de línea
        })
        .style('stroke-dasharray', d => {
            const attribute = d.target.data.name;
            return attribute && isMeteorologicalAttribute(attribute) ? '5,5' : '0'; // Líneas discontinuas para meteorología
        });

    // Dibujar los nodos
    const node = svg.selectAll('.node')
                    .data(root.descendants())
                    .enter().append('g')
                    .attr('class', 'node')
                    .attr('transform', d => `rotate(${(d.x * 180 / Math.PI - 90)}) translate(${d.y}, 0)`);

    // Agregar círculo para los nodos
    node.append('circle')
        .attr('r', 5)
        .style('fill', d => {
            const distance = d.data.distance || 0;
            return colorScale(distance); // Aplicar el color basado en la distancia
        })
        .on('mouseover', (event, d) => {
            d3.select(event.currentTarget) // Seleccionar el círculo actual
                .transition() // Agregar una transición
                .duration(200) // Duración de la transición
                .attr('r', 8) // Aumentar el radio
                .style('stroke', 'yellow') // Cambiar el borde a amarillo
                .style('stroke-width', 2); // Grosor del borde
        
            // Mostrar el tooltip con la distancia del nodo, redondeada a dos decimales
            tooltip.html(`Distancia: ${(d.data.distance || 0).toFixed(2)}`)
                   .style('visibility', 'visible')
                   .style('left', `${event.pageX + 10}px`)
                   .style('top', `${event.pageY - 20}px`);
        })
        
        .on('mouseout', (event) => {
            d3.select(event.currentTarget) // Seleccionar el círculo actual
                .transition() // Agregar una transición
                .duration(200) // Duración de la transición
                .attr('r', 5) // Volver al radio original
                .style('stroke', 'none'); // Quitar el borde

            // Ocultar el tooltip
            tooltip.style('visibility', 'hidden');
        })
        .on('click', (event, d) => {
            // Obtén la ciudad y el contaminante de los datos
            const contaminant = d.data.name;
            const startDate = dateRange.split(' a ')[0];
            const endDate = dateRange.split(' a ')[1];

            // Mostrar los datos en consola
            // console.log(`Ciudad: ${selectedCity}`);
            // console.log(`Contaminante: ${contaminant}`);
            // console.log(`Rango de fechas: ${startDate} a ${endDate}`);
            // updateTimeSeriesChart(selectedCity, startDate, endDate);
            
        });

        // Añadir los textos dinámicos según los atributos seleccionados
        node.append('text')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .attr('dy', '.60em')
            .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
            .attr('dx', d => d.x < Math.PI ? '10' : '-10')
            .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
            .text(d => {
                const attributeIndex = d.data.index;
                return selectedAttributes.length > 0 ? selectedAttributes[attributeIndex] : d.data.name;
            });

        // Dibujar el triángulo rojo en el nodo raíz
        svg.append('polygon')
            .attr('points', `${-5},${-15} ${5},${-15} ${0},${-25}`)
            .attr('transform', `translate(0, -33) rotate(180)`)
            .style('fill', 'blue')
            .style('visibility', root.children ? 'visible' : 'hidden');
}


// Función para determinar si un atributo es meteorológico
function isMeteorologicalAttribute(attribute) {
    const meteorologicalAttributes = ['TEMP', 'PRES', 'DEWP', 'RAIN']; // Asegúrate de que estos sean los atributos correctos
    return meteorologicalAttributes.includes(attribute);
}


function updateTimeSeriesChart(selectedCity, startDate, endDate, selectedDates = null) {
    const container = d3.select('#serie-temporal');
    const margin = { top: 20, right: 10, bottom: 60, left: 50 };
    const width = 830 - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;
    // console.log(startDate, endDate,);
    // Añadir y configurar el checkbox AQI
    let aqiCheckboxContainer = container.select('#aqi-checkbox-container');
    if (aqiCheckboxContainer.empty()) {
        aqiCheckboxContainer = container.append('div')
            .attr('id', 'aqi-checkbox-container')
            .style('position', 'absolute')
            .style('right', '2%')
            .style('bottom', '87%')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '5px')
            .style('background-color', 'rgba(255, 255, 255, 0.8)')
            .style('padding', '5px')
            .style('border-radius', '4px');
        
        aqiCheckboxContainer.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'aqi-size-toggle')
            .style('cursor', 'pointer');
        
        aqiCheckboxContainer.append('label')
            .attr('for', 'aqi-size-toggle')
            .text('AQI')
            .style('font-weight', 'bold')
            .style('cursor', 'pointer')
            .style('user-select', 'none');
    }

    const aqiCheckbox = document.querySelector('#aqi-size-toggle');
    const savedAqiState = localStorage.getItem('aqiCheckboxState');
    aqiCheckbox.checked = savedAqiState === 'true'; // Restaurar el estado

    aqiCheckbox.addEventListener('change', function () {
        localStorage.setItem('aqiCheckboxState', aqiCheckbox.checked); // Guardar el estado
        d3.select('#serie-temporal')
            .selectAll('circle')
            .transition()
            .duration(200)
            .attr('r', aqiCheckbox.checked ? 4 : 0);
    });

    // Añadir y configurar el checkbox Line
    let lineCheckboxContainer = container.select('#line-checkbox-container');
    if (lineCheckboxContainer.empty()) {
        lineCheckboxContainer = container.append('div')
            .attr('id', 'line-checkbox-container')
            .style('position', 'absolute')
            .style('right', '1.35%')
            .style('bottom', '80%')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '5px')
            .style('background-color', 'rgba(255, 255, 255, 0.8)')
            .style('padding', '5px')
            .style('border-radius', '4px');
        
        lineCheckboxContainer.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'line-size-toggle')
            .style('cursor', 'pointer');
        
        lineCheckboxContainer.append('label')
            .attr('for', 'line-size-toggle')
            .text('Line')
            .style('font-weight', 'bold')
            .style('cursor', 'pointer')
            .style('user-select', 'none');
    }

    const lineCheckbox = document.querySelector('#line-size-toggle');
    const savedLineState = localStorage.getItem('lineCheckboxState');
    lineCheckbox.checked = savedLineState === 'true'; // Restaurar el estado

    lineCheckbox.addEventListener('change', function () {
        localStorage.setItem('lineCheckboxState', lineCheckbox.checked); // Guardar el estado
    
        // Actualizar opacidades de las líneas según el estado del checkbox
        d3.select('#serie-temporal')
            .selectAll('path.line')
            .transition()
            .duration(200)
            .style('opacity', function () {
                const pathElement = d3.select(this);
                const isSelected = pathElement.classed('selected');
                return lineCheckbox.checked ? (isSelected ? 1 : 0.1) : 0;
            });
    });
    
    

    const contaminantAttributes = ['PM2_5', 'PM10', 'SO2', 'NO2', 'CO', 'O3'];
    const meteorologicalAttributes = ['TEMP', 'PRES', 'DEWP', 'RAIN'];
    const dailyLimits = {
        'PM2_5': 150,
        'PM10': 150,
        'CO': 4, // Convertido a µg/m³ (4 mg/m³ * 1000)
        'SO2': 150,
        'NO2': 80,
        'O3': 200
    };

    const aqiRanges = [[0, 50], [50, 100], [100, 150], [150, 200], [200, 300], [300, 400], [400, 600]];
    const aqiColors = ['#00e400', '#ff0', '#ff7e00', '#f00', '#99004c', '#7e0023'];
    const meteorologicalColor = 'blue';

    // Define los colores de las estaciones
    const seasonColors = {
        'Spring': '#2ecc71',
        'Summer': '#e67e22',
        'Autumn': '#9b59b6',
        'Winter': '#3498db'
    };

    function getSeason(date) {
        const month = date.getMonth(); // Get month (0-11)
        const day = date.getDate(); // Get day (1-31)
        
        if ((month === 2 && day >= 20) || (month > 2 && month < 5) || (month === 5 && day <= 21)) {
            return 'Spring';
        } else if ((month === 5 && day >= 21) || (month > 5 && month < 8) || (month === 8 && day <= 22)) {
            return 'Summer';
        } else if ((month === 8 && day >= 23) || (month > 8 && month < 11) || (month === 11 && day <= 21)) {
            return 'Autumn';
        } else {
            return 'Winter';
        }
    }

    
    function normalizeValue(value, min, max) {
        if (min === max) return 0.5; // Evitar divisiones por cero
        return (value - min) / (max - min);
    }

    function getAQIColor(value, attribute) {
        if (attribute === 'CO') {
            // Convertir CO de mg/m³ a µg/m³ antes de calcular el AQI
            value /= 1000; // Conversión de mg/m³ a µg/m³
        }
        if (dailyLimits[attribute] && !isNaN(value)) {
            const limit = dailyLimits[attribute];
            const aqiIndex = aqiRanges.findIndex(range => value <= (limit * range[1]) / 100);
            return aqiIndex >= 0 ? aqiColors[aqiIndex] : '#7e0023'; // Negro si está fuera de rango
        }
        return meteorologicalColor; // Usar color azul para atributos meteorológicos
    }

    d3.csv(`data/${selectedCity}`).then(data => {
        const attributes = [...contaminantAttributes, ...meteorologicalAttributes];

        let selectedAttributes = JSON.parse(localStorage.getItem('selectedAttributes')) || ["PM2_5"];

        const attributeColors = {
            'PM2_5': '#FF0000', 
            'PM10': '#FF9900', 
            'SO2': '#FFD700', 
            'NO2': '#d500f1', 
            'CO': '#00CED1', 
            'O3': '#0000FF', 
            'TEMP': '#008000', 
            'PRES': '#8B0000', 
            'DEWP': '#4B0082', 
            'RAIN': '#1E90FF'  
        };
        // Paso 1: Procesar los datos y calcular promedio de WSPM por día
        const parsedData = d3.group(
            data,
            d => d3.timeFormat("%Y-%m-%d")(new Date(d.year, d.month - 1, d.day)) // Agrupar por día
        );

        const dailyData = Array.from(parsedData, ([date, values]) => {
            const WSPMValues = values.map(v => +v.WSPM).filter(v => !isNaN(v)); // Obtener valores numéricos de WSPM

            // Calcular el promedio de WSPM para el día
            const averageWSPM = WSPMValues.length > 0
                ? WSPMValues.reduce((acc, val) => acc + val, 0) / WSPMValues.length
                : null;

            return {
                date: new Date(date),
                WSPMValues, // Todos los valores de WSPM del día
                averageWSPM, // Promedio de WSPM del día
            };
        });

        // console.log("Datos de velocidad del viento por día con promedio:", dailyData);

        let checkboxContainer = container.select('#checkbox-container');
        if (checkboxContainer.empty()) {
            checkboxContainer = container.append('div')
                .attr('id', 'checkbox-container')
                .style('display', 'flex')
                .style('gap', '10px')
                .style('flex-wrap', 'wrap')
                .style('font-weight', 'bold') 
                .style('margin', '30px 0 10px 50px');
        } else {
            checkboxContainer.selectAll('*').remove();
        }
        
        checkboxContainer.selectAll('div')
            .data(attributes)
            .join('div')
            .style('display', 'flex')
            .style('align-items', 'center')  
            .style('gap', '5px') 
            .each(function (attribute) {
                const div = d3.select(this);
                div.append('input')
                    .attr('type', 'checkbox')
                    .attr('value', attribute)
                    .property('checked', selectedAttributes.includes(attribute))  
                    .on('change', function () {
                        selectedAttributes = d3.selectAll('#checkbox-container input:checked')
                            .nodes()
                            .map(node => node.value);
        
                        // Guarda el estado en el localStorage
                        localStorage.setItem('selectedAttributes', JSON.stringify(selectedAttributes));
        
                        // Llama a drawChart para actualizar el gráfico
                        drawChart(selectedAttributes, data, startDate, endDate, selectedDates, dailyData);
                    });
        
                div.append('label')
                    .text(attribute)
                    .style('cursor', 'pointer')
                    .style('color', attributeColors[attribute])  
                    .style('margin', '0')  
                    .style('vertical-align', 'middle'); 
            });
            drawChart(selectedAttributes, data, startDate, endDate, selectedDates, dailyData);
    });

    
    function drawChart(selectedAttributes, data, startDate, endDate, selectedDates, dailyData) {
        const containerId = 'chart-container';
        let chartContainer = container.select(`#${containerId}`);
        
        if (chartContainer.empty()) {
            chartContainer = container.append('div')
                .attr('id', containerId)
                .style('margin-bottom', '30px');
        }
    
        // Filtrar datos si startDate y endDate están definidos
        let filteredData = data.map(d => ({
            date: new Date(`${d.year}-${d.month}-${d.day}`),
            value: selectedAttributes.reduce((acc, attribute) => {
                acc[attribute] = +d[attribute.replace('.', '_')];
                return acc;
            }, {})
        }));
    
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            filteredData = filteredData.filter(d => d.date >= start && d.date <= end);
        }
    
        // Filtro para fechas duplicadas
        const uniqueDates = new Set();
        filteredData = filteredData.filter(d => {
            const formattedDate = d3.timeFormat("%Y-%m-%d")(d.date);
            if (uniqueDates.has(formattedDate)) {
                return false; // Ignorar duplicados
            }
            uniqueDates.add(formattedDate);
            return true; // Incluir fechas únicas
        });
    
        const selectedDateSet = selectedDates 
            ? new Set(selectedDates.map(d => new Date(d).toISOString().split('T')[0])) 
            : null;
    
        const averagedData = d3.groups(filteredData, d => d.date)
            .map(([date, values]) => ({
                date: date,
                value: selectedAttributes.reduce((acc, attribute) => {
                    acc[attribute] = d3.mean(values, v => v.value[attribute]);
                    return acc;
                }, {}),
                isSelected: selectedDateSet ? selectedDateSet.has(date.toISOString().split('T')[0]) : true
            }));
            
        const minValues = {};
        const maxValues = {};
        selectedAttributes.forEach(attribute => {
            const values = averagedData.map(d => d.value[attribute]).filter(v => !isNaN(v));
            minValues[attribute] = d3.min(values);
            maxValues[attribute] = d3.max(values);
        });
    
        const normalizedData = averagedData.map(d => {
            const normalizedValues = { ...d.value };
            selectedAttributes.forEach(attribute => {
                if (meteorologicalAttributes.includes(attribute) || contaminantAttributes.includes(attribute)) {
                    normalizedValues[attribute] = normalizeValue(
                        d.value[attribute],
                        minValues[attribute],
                        maxValues[attribute]
                    );
                }
            });
            return { ...d, normalizedValues };
        });
    
        const svg = chartContainer.select('svg');
        if (!svg.empty()) svg.remove();
    
        const chartSvg = chartContainer.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
        const xScale = d3.scaleTime()
            .domain(d3.extent(normalizedData, d => d.date))
            .range([0, width]);
    
        const yExtent = d3.extent(
            normalizedData.flatMap(d => selectedAttributes.map(attr => d.normalizedValues[attr]))
        );
        const yScale = d3.scaleLinear()
            .domain([Math.min(0, yExtent[0]), Math.max(1, yExtent[1])])
            .range([height, 0]);
    
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d-%m-%Y"));
        const yAxis = d3.axisLeft(yScale);
    
        chartSvg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "middle")
            .style('font-size', '10px')
            .attr("dx", "-34px")
            .attr("dy", "0px")
            .attr("transform", "rotate(-30)");
    
        chartSvg.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .style('font-size', '10px');
    
        // Agregar los rectángulos de fondo para las estaciones
        normalizedData.forEach(d => {
            const month = d.date.getMonth() + 1;
            const day = d.date.getDate();
            const season = getSeason(d.date);
    
            chartSvg.append('rect')
                .attr('x', xScale(d.date))
                .attr('y', 0)
                .attr('width', xScale(new Date(d.date.getTime() + 86400000)) - xScale(d.date))
                .attr('height', height)
                .attr('fill', seasonColors[season])
                .attr('opacity', 0.15);
        });
    
        const lineCheckbox = document.querySelector('#line-size-toggle');
    
        if (lineCheckbox && lineCheckbox.checked) {
            selectedAttributes.forEach(attribute => {
                const lineData = normalizedData.filter(d => !isNaN(d.normalizedValues[attribute]));
                
                // Crear datos separados para las líneas seleccionadas y no seleccionadas
                const selectedLineData = lineData.filter(d => d.isSelected).map(d => ({
                    x: xScale(d.date),
                    y: yScale(d.normalizedValues[attribute]),
                    date: d.date
                }));
        
                const unselectedLineData = lineData.map(d => ({
                    x: xScale(d.date),
                    y: yScale(d.normalizedValues[attribute]),
                    date: d.date
                }));
        
                // Umbral de continuidad (por ejemplo, 1 día)
                const continuityThreshold = 1 * 24 * 60 * 60 * 1000; // 1 día en milisegundos
        
                // Función para dividir en segmentos continuos
                const divideIntoSegments = data => {
                    const segments = [];
                    let currentSegment = [];
        
                    for (let i = 0; i < data.length; i++) {
                        if (currentSegment.length === 0) {
                            currentSegment.push(data[i]);
                        } else {
                            const lastPoint = currentSegment[currentSegment.length - 1];
                            const currentPoint = data[i];
                            if (currentPoint.date - lastPoint.date <= continuityThreshold) {
                                currentSegment.push(currentPoint);
                            } else {
                                segments.push(currentSegment);
                                currentSegment = [currentPoint];
                            }
                        }
                    }
                    if (currentSegment.length > 0) {
                        segments.push(currentSegment);
                    }
                    return segments;
                };
        
                // Dividir datos seleccionados en segmentos
                const selectedSegments = divideIntoSegments(selectedLineData);
        
                // Dibujar la línea continua para los datos no seleccionados con menor opacidad
                if (unselectedLineData.length > 1) {
                    drawLine(chartSvg, unselectedLineData, attribute, attributeColors[attribute], 0.3); // Opacidad 0.3
                }
        
                // Dibujar las líneas para los segmentos seleccionados con opacidad completa
                selectedSegments.forEach(segment => {
                    if (segment.length > 1) { // Asegúrate de que haya suficientes puntos para una línea
                        drawLine(chartSvg, segment, attribute, attributeColors[attribute], 1); // Opacidad completa
                    }
                });
            });
        }
        
        
        

        const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("box-shadow", "0px 2px 10px rgba(0, 0, 0, 0.2)")
        .style("pointer-events", "none")
        .style("opacity", 0);
        
        // Brush setup
        const brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("end", brushended);

        chartSvg.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushended(event) {
            if (!event.selection) return; // Si no se ha seleccionado nada, no hacer nada

            const [x0, x1] = event.selection;
            const newDomain = [xScale.invert(x0), xScale.invert(x1)];

            // Actualizar las escalas y el gráfico
            xScale.domain(newDomain);
        
            // Llamar nuevamente a drawChart con los datos filtrados según el área seleccionada
            drawChart(selectedAttributes, data, newDomain[0], newDomain[1], selectedDates, dailyData);
        }

        // Reset the chart on double-click
        chartSvg.on("dblclick", function() {
            xScale.domain(d3.extent(normalizedData, d => d.date)); // Restablecer dominio de la escala X
            drawChart(selectedAttributes, data, null, null, selectedDates, dailyData); // Volver a cargar los datos completos
        });
        // Dibujar los puntos
        selectedAttributes.forEach(attribute => {
            const lineData = normalizedData.filter(d => !isNaN(d.normalizedValues[attribute]));

            chartSvg.selectAll(`circle.${attribute}`)
                .data(lineData)
                .join('circle')
                .attr('class', attribute)
                .attr('cx', d => xScale(d.date))
                .attr('cy', d => yScale(d.normalizedValues[attribute]))
                .attr('r', () => {
                    const aqiCheckbox = document.querySelector('#aqi-size-toggle');
                    return aqiCheckbox && aqiCheckbox.checked ? 4 : 0;
                })
                .attr('fill', d => getAQIColor(d.value[attribute], attribute))
                .attr('stroke-width', 1.5)
                .attr('opacity', d => d.isSelected ? 1 : 0.08)
                .on('mouseover', function(event, d) {
                    const [mouseX, mouseY] = d3.pointer(event);
                    const point = d3.select(this);

                    // Sumar un día a la fecha
                    const modifiedDate = d3.timeDay.offset(d.date, -1);
                    const pointDate = d3.timeFormat("%Y-%m-%d")(modifiedDate);

                    // Filtrar los registros de dailyData para la fecha modificada
                    const matchingRecords = dailyData.filter(record => d3.timeFormat("%Y-%m-%d")(record.date) === pointDate);

                    // Calcular el promedio de WSPMValues
                    const windSpeed = matchingRecords.length > 0 
                        ? (matchingRecords.reduce((sum, record) => {
                            // Sumar todos los valores en WSPMValues
                            const totalWSPM = record.WSPMValues.reduce((acc, value) => acc + value, 0);
                            // Calcular el promedio
                            return sum + (totalWSPM / record.WSPMValues.length);
                        }, 0) / matchingRecords.length).toFixed(2)
                        : 'No disponible';

                    // Transición para agrandar el punto seleccionado
                    point.transition()
                        .duration(200)
                        .attr('r', 10)
                        .style('stroke', 'cyan')
                        .style('stroke-width', 3);

                    // Actualiza el contenido del tooltip
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);

                    // Mapeo de atributos a sus unidades
                    const units = {
                        'PM2_5': 'µg/m³',
                        'PM10': 'µg/m³',
                        'SO2': 'µg/m³',
                        'NO2': 'µg/m³',
                        'CO': 'mg/m³',
                        'O3': 'µg/m³',
                        'TEMP': '°C',
                        'PRES': 'hPa',
                        'DEWP': '°C',
                        'RAIN': 'mm'
                    };

                    const selectedCity = document.querySelector('#city-checkboxes input[type="radio"]:checked').value;
                    tooltip.html(`
                        <strong>Ciudad:</strong> ${selectedCity.replace('Data_', '').replace('.csv', '')}<br>
                        <strong>Contaminante:</strong> ${attribute}<br>
                        <strong>Fecha:</strong> ${d3.timeFormat("%d/%m/%Y")(d.date)}<br>
                        <strong>Concentración:</strong> ${d.value[attribute]?.toFixed(2)} ${units[attribute] || ''}<br>
                        <strong>Velocidad del viento:</strong> ${windSpeed} m/s<br>
                    `);
        
                
                    // Obtener dimensiones del tooltip
                    const tooltipNode = tooltip.node();
                    const tooltipWidth = tooltipNode.offsetWidth;
                    const tooltipHeight = tooltipNode.offsetHeight;
                
                    // Calcular posición limitada dentro de los márgenes de la gráfica
                    let tooltipX = event.pageX;
                    let tooltipY = event.pageY;
                
                    // Limitar X dentro del área visible
                    if (tooltipX + tooltipWidth > width + margin.left) {
                        tooltipX = tooltipX - tooltipWidth - 10; // 10px de offset
                    }
                
                    // Limitar Y dentro del área visible
                    if (tooltipY + tooltipHeight > height + margin.top) {
                        tooltipY = tooltipY - tooltipHeight - 10; // 10px de offset
                    }
                
                    // Asegurar que no se salga por la izquierda o arriba
                    tooltipX = Math.max(margin.left, tooltipX);
                    tooltipY = Math.max(margin.top, tooltipY);
                
                    // Aplicar la posición calculada
                    tooltip.style('left', `${tooltipX}px`)
                        .style('top', `${tooltipY}px`)
                        .style('color', 'black');
                })
                
                .on('mouseout', function() {
                    const point = d3.select(this);
                    point.transition()
                        .duration(200)
                        .attr('r', 4)
                        .style('stroke', 'none')
                        .style('stroke-width', 0);
                
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0);
                })
                .on('click', function(event, d) {

                    
                    // Eliminar la ventana flotante previa, si existe
                    let floatingWindow = d3.select('#floating-window');
                    if (!floatingWindow.empty()) {
                        floatingWindow.remove();
                    }
                    // Obtener las coordenadas del mouse
                    const [mouseX, mouseY] = d3.pointer(event, svg.node());
                
                    // Limitar la posición de la ventana emergente dentro de los límites de la gráfica
                    const windowWidth = 400;
                    const windowHeight = 240;
                
                    const maxX = width + margin.left - windowWidth;
                    const maxY = height + margin.top - windowHeight;
                
                    const padding = 10;
                    const limitedX = Math.min(mouseX + margin.left + padding, maxX);
                    const limitedY = Math.min(mouseY + margin.top + padding, maxY);
                
                    // Crear nueva ventana flotante
                    floatingWindow = container.append('div')
                        .attr('id', 'floating-window')
                        .style('position', 'absolute')
                        .style('left', `${limitedX}px`)
                        .style('top', `${limitedY}px`)
                        .style('background-color', '#fff')
                        .style('border', '1px solid #ccc')
                        .style('padding', '10px')
                        .style('border-radius', '4px')
                        .style('box-shadow', '0px 4px 8px rgba(0, 0, 0, 0.1)')
                        .style('z-index', 1000);
                
                    // Botón para cerrar la ventana
                    floatingWindow.append('button')
                        .text('X')
                        .attr('class', 'close-button')
                        .style('position', 'absolute')
                        .style('top', '5px')
                        .style('right', '5px')
                        .style('border', 'none')
                        .style('background', 'transparent')
                        .style('font-size', '14px')
                        .style('cursor', 'pointer')
                        .on('click', () => floatingWindow.remove());
                

                    const selectedCity = document.querySelector('#city-checkboxes input[type="radio"]:checked').value;
                
                    // Título de la ventana emergente
                    floatingWindow.append('div')
                        .style('text-align', 'center')
                        .style('font-size', '14px')
                        .style('font-weight', 'bold')
                        .style('margin-bottom', '10px')
                        .text(`Serie temporal por hora de la fecha ${d3.timeFormat("%d-%m-%Y")(d.date)} `);
                    


                    // Colores definidos para cada atributo
                    const attributeColors = {
                        'PM2_5': '#FF0000', // Rojo fuerte para reflejar peligro
                        'PM10': '#FF9900', // Naranja brillante para particulado
                        'SO2': '#FFD700', // Amarillo intenso para gases tóxicos
                        'NO2': '#d500f1', // Verde neón para contaminación visible
                        'CO': '#00CED1', // Turquesa vibrante para gas incoloro
                        'O3': '#0000FF', // Azul intenso para ozono
                        'TEMP': '#008000', // Rosa fuerte para variación térmica
                        'PRES': '#8B0000', // Rojo oscuro para presión atmosférica
                        'DEWP': '#4B0082', // Indigo para representar humedad
                        'RAIN': '#1E90FF'  // Azul cielo para lluvia
                    };

                
                    const units = {
                        'PM2_5': 'µg/m³',
                        'PM10': 'µg/m³',
                        'SO2': 'µg/m³',
                        'NO2': 'µg/m³',
                        'CO': 'mg/m³',
                        'O3': 'µg/m³',
                        'TEMP': '°C',
                        'PRES': 'hPa',
                        'DEWP': '°C',
                        'RAIN': 'mm'
                    };

                    // Crear checkboxes
                    const checkboxContainer = floatingWindow.append('div')
                        .style('display', 'flex')
                        .style('flex-direction', 'column');
                
                    const contaminants = ['PM2_5', 'PM10', 'SO2', 'NO2', 'CO', 'O3'];
                    const meteorologicalFactors = ['TEMP', 'PRES', 'DEWP', 'RAIN'];
                
                    const contaminantChecks = checkboxContainer.append('div')
                        .style('display', 'flex')
                        .style('font-size', '12px');
                
                    contaminants.forEach(contaminant => {
                        // Cambiar la condición para que el checkbox esté marcado si es el contaminante actual
                        const isChecked = contaminant === attribute; // Usar 'attribute' en lugar de 'currentContaminant'
                        contaminantChecks.append('label')
                            .style('margin-right', '10px')
                            .style('color', attributeColors[contaminant])
                            .text(contaminant)
                            .append('input')
                            .attr('type', 'checkbox')
                            .attr('value', contaminant)
                            .property('checked', isChecked)
                            .on('change', updateChart);
                    });
                
                    const meteorologicalChecks = checkboxContainer.append('div')
                        .style('display', 'flex')
                        .style('font-size', '12px');
                
                    meteorologicalFactors.forEach(factor => {
                        // Similar para factores meteorológicos
                        const isCheckedmet = factor === attribute;
                        meteorologicalChecks.append('label')
                            .style('margin-right', '10px')
                            .style('color', attributeColors[factor])
                            .text(factor)
                            .append('input')
                            .attr('type', 'checkbox')
                            .attr('value', factor)
                            .property('checked', isCheckedmet)
                            .on('change', updateChart);
                    });
                
                    function updateChart() {
                        const selectedContaminants = Array.from(floatingWindow.selectAll('input[type="checkbox"]:checked'))
                            .map(input => input.value);
                
                        d3.csv(`data/${selectedCity}`).then(hourlyData => {
                            const selectedDayData = hourlyData
                            .filter(row => {
                                const rowDate = new Date(`${row.year}-${row.month}-${row.day}`);
                                return rowDate.getTime() === d.date.getTime();
                            })
                            .map(row => {
                                const data = {};
                                selectedContaminants.forEach(contaminant => {
                                    data[contaminant] = +row[contaminant.replace('.', '_')] || NaN;
                                });
                                data.hour = +row.hour;
                                return data;
                            });
            
                        // Normalización para visualización (sin alterar los valores reales)
                        const normalizedData = selectedDayData.map(d => {
                            const normalized = { hour: d.hour };
                            selectedContaminants.forEach(contaminant => {
                                const values = selectedDayData.map(row => row[contaminant]).filter(v => !isNaN(v));
                                const minValue = d3.min(values);
                                const maxValue = d3.max(values);
                                normalized[contaminant] = isNaN(d[contaminant])
                                    ? NaN
                                    : (d[contaminant] - minValue) / (maxValue - minValue);
                            });
                            return normalized;
                        });
            
                        floatingWindow.select('svg').remove();
            
                        const miniMargin = { top: 20, right: 20, bottom: 40, left: 50 };
                        const miniWidth = 400 - miniMargin.left - miniMargin.right;
                        const miniHeight = 200 - miniMargin.top - miniMargin.bottom;
            
                        const miniSvg = floatingWindow.append('svg')
                            .attr('width', miniWidth + miniMargin.left + miniMargin.right)
                            .attr('height', miniHeight + miniMargin.top + miniMargin.bottom)
                            .append('g')
                            .attr('transform', `translate(${miniMargin.left}, ${miniMargin.top})`);
            
                        const xMiniScale = d3.scaleLinear()
                            .domain([0, 23])
                            .range([0, miniWidth]);
            
                        const xMiniAxis = d3.axisBottom(xMiniScale).ticks(8).tickValues(d3.range(0, 24, 3)).tickFormat(d => `${d}:00`);
                        const yMiniScale = d3.scaleLinear().domain([0, 1]).range([miniHeight, 0]);
            
                        miniSvg.append('g')
                            .attr('transform', `translate(0, ${miniHeight})`)
                            .call(xMiniAxis)
                            .selectAll('text')
                            .style('text-anchor', 'end')
                            .attr('dx', '-0.5em')
                            .attr('dy', '-0.2em')
                            .attr('transform', 'rotate(-45)');
            
                        miniSvg.append('g').call(d3.axisLeft(yMiniScale));
            
                        selectedContaminants.forEach(contaminant => {
                            const line = d3.line()
                            .defined(d => !isNaN(d[contaminant]))
                            .x(d => xMiniScale(d.hour))
                            .y(d => yMiniScale(d[contaminant]))
                            .curve(d3.curveMonotoneX); 
                        
            
                            miniSvg.append('path')
                                .datum(normalizedData)
                                .attr('fill', 'none')
                                .attr('stroke', attributeColors[contaminant])
                                .attr('stroke-width', 1.5)
                                .attr('d', line);
            
                            // Puntos en cada hora
                            miniSvg.selectAll(`.point-${contaminant}`)
                                .data(selectedDayData)
                                .enter()
                                .append('circle')
                                .attr('class', `point-${contaminant}`)
                                .attr('cx', d => xMiniScale(d.hour))
                                .attr('cy', (d, i) => yMiniScale(normalizedData[i][contaminant]))
                                .attr('r', 3)
                                .attr('fill', attributeColors[contaminant]);
                        });
            
                        // Línea vertical y valores dinámicos
                        const verticalLine = miniSvg.append('line')
                            .attr('y1', 0)
                            .attr('y2', miniHeight)
                            .attr('stroke', '#000')
                            .attr('stroke-dasharray', '4 2')
                            .attr('visibility', 'hidden');
            
                            const tooltip = floatingWindow.append('div')
                            .attr('id', 'tooltip')
                            .style('position', 'absolute')
                            .style('background', '#fff')
                            .style('border', '1px solid #ccc')
                            .style('padding', '5px')
                            .style('border-radius', '4px')
                            .style('box-shadow', '0px 4px 8px rgba(0, 0, 0, 0.1)')
                            .style('font-size', '10px') // Tamaño reducido de fuente
                            .style('line-height', '1.2')
                            .style('visibility', 'hidden');
                        
                        miniSvg.append('rect')
                            .attr('width', miniWidth)
                            .attr('height', miniHeight)
                            .attr('fill', 'none')
                            .attr('pointer-events', 'all')
                            .on('mousemove', function(event) {
                                const [mouseX, mouseY] = d3.pointer(event, this); // Obtener posición del mouse
                                const hour = Math.round(xMiniScale.invert(mouseX)); // Hora más cercana
                                const xPosition = xMiniScale(hour); // Posición exacta de la línea en el eje X
                            
                                // Actualizar posición de la línea vertical
                                verticalLine.attr('x1', xPosition).attr('x2', xPosition).attr('visibility', 'visible');
                            

                                const modifiedDate2 = d3.timeDay.offset(d.date, -1);


                                // Filtrar los datos de `dailyData` para encontrar la fecha seleccionada
                                const selectedDate = d3.timeFormat("%Y-%m-%d")(modifiedDate2); // Formato de la fecha actual
                                const matchingRecord = dailyData.find(record => {
                                    const recordDate = d3.timeFormat("%Y-%m-%d")(record.date); // Formatear la fecha del registro
                                    return recordDate === selectedDate;
                                });
                            
                                // Extraer la velocidad del viento para la hora actual
                                let windSpeed = 'No disponible';
                                if (matchingRecord && matchingRecord.WSPMValues && matchingRecord.WSPMValues.length === 24) {
                                    windSpeed = `${matchingRecord.WSPMValues[hour]?.toFixed(2)} m/s`; // Velocidad específica de la hora
                                }
                            
                                // Obtener datos de contaminantes para la hora seleccionada en `selectedDayData`
                                const hourData = selectedDayData.find(d => d.hour === hour);
                            
                                if (hourData) {
                                    tooltip.style('visibility', 'visible')
                                        .style('left', `${xPosition + miniMargin.left}px`) // Ajustar al eje X del gráfico
                                        .style('top', `${yMiniScale(1) + miniMargin.top + 65}px`) // Justo encima del gráfico
                                        .html(
                                            selectedContaminants
                                                .map(contaminant =>
                                                    `${contaminant}: ${hourData[contaminant]} ${units[contaminant]}`
                                                )
                                                .join('<br>') +
                                            `<br>Vel. del viento: ${windSpeed}` // Mostrar la velocidad del viento
                                        );
                                } else {
                                    tooltip.style('visibility', 'hidden');
                                }
                            })
                            .on('mouseout', () => {
                                verticalLine.attr('visibility', 'hidden');
                                tooltip.style('visibility', 'hidden');
                            });
                            
                            
                        
                    });
                }
            
                updateChart();

            })
        });
    }
    
    
    
}

function drawLine(chartSvg, points, attribute, color, opacity = 1, isSelected = false) {
    const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveMonotoneX);

    chartSvg.append('path')
        .data([points])
        .attr('class', `line ${attribute} ${isSelected ? 'selected' : 'not-selected'}`)
        .attr('d', lineGenerator(points))
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', opacity)
        .on('mouseover', function () {
            d3.select(this)
                .attr('stroke-width', 4);
        })
        .on('mouseout', function () {
            d3.select(this)
                .attr('stroke-width', 2);
        });
}


// Variable global para almacenar el contaminante seleccionado actualmente
let currentContaminant = null;
// Manejar cambios en los radio buttons
document.querySelectorAll('#city-checkboxes input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', handleCityOrCheckboxChange);
});

// Manejar cambios en el checkbox
document.getElementById('visualizar-todo').addEventListener('change', handleCityOrCheckboxChange);

async function handleCityOrCheckboxChange() {
    // Ciudad seleccionada
    const selectedCity = document.querySelector('#city-checkboxes input[type="radio"]:checked')?.value || null;

    // Verificar si el checkbox 'visualizar-todo' está marcado
    const isChecked = document.getElementById('visualizar-todo').checked;

    let dateList = [];
    if (isChecked) {
        // Generar fechas desde el 1 de marzo de 2013 hasta el 28 de febrero de 2017
        const start = new Date(2013, 2, 1); // Marzo es el mes 2 (0 indexado)
        const end = new Date(2017, 1, 28); // Febrero es el mes 1 (0 indexado)
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dateList.push(new Date(date).toISOString().split('T')[0]); // Formatear fecha en formato YYYY-MM-DD
        }
    } else {
        // Usar las fechas seleccionadas en los inputs
        const startDate = document.getElementById('fecha-inicio').value;
        const endDate = document.getElementById('fecha-fin').value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                dateList.push(new Date(date).toISOString().split('T')[0]); // Formatear fecha en formato YYYY-MM-DD
            }
        } else {
            console.warn("Por favor selecciona un rango de fechas válido.");
        }
    }

    // Llamar a la función drawThemeRiver con la ciudad seleccionada y las fechas generadas
    try {
        await drawThemeRiver(selectedCity, dateList);
    } catch (error) {
        console.error("Error al ejecutar drawThemeRiver:", error);
    }

    // Establecer un contaminante por defecto (por ejemplo, PM2.5)
    currentContaminant = currentContaminant || 'PM2_5';

    // Actualizar las gráficas
    updateChart();
    updateCorrelationMatrix();
    // updateUMAP();
    updateTimeSeriesChart(selectedCity, isChecked ? null : document.getElementById('fecha-inicio').value, isChecked ? null : document.getElementById('fecha-fin').value);

}
// Escuchar cambios en el rango de fechas
document.getElementById('fecha-inicio').addEventListener('change', handleDateChange);
document.getElementById('fecha-fin').addEventListener('change', handleDateChange);

async function handleDateChange() {
    const selectedCity = document.querySelector('#city-checkboxes input[type="radio"]:checked')?.value || null;
    const startDate = document.getElementById('fecha-inicio').value;
    const endDate = document.getElementById('fecha-fin').value;

    if (!startDate || !endDate) {
        console.warn("Por favor selecciona un rango de fechas válido.");
        return;
    }

    // Generar el rango de fechas
    const dateList = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        dateList.push(new Date(date).toISOString().split('T')[0]); // Formatear fecha en formato YYYY-MM-DD
    }

    // Llamar a drawThemeRiver
    try {
        await drawThemeRiver(selectedCity, dateList);
    } catch (error) {
        console.error("Error al ejecutar drawThemeRiver:", error);
    }

    // Actualizar las gráficas
    updateChart();
    if (currentContaminant) {
        updateTimeSeriesChart(selectedCity, startDate, endDate);
    }

}


document.getElementById('visualizar-todo').addEventListener('change', function () {
    const isChecked = this.checked;
    document.getElementById('fecha-inicio').disabled = isChecked;
    document.getElementById('fecha-fin').disabled = isChecked;
    
    // Actualizar todas las gráficas
    updateChart();
    updateCorrelationMatrix();
    
    // Actualizar la serie temporal si hay un contaminante seleccionado
    if (currentContaminant) {
        const selectedCity = document.querySelector('#city-checkboxes input[type="radio"]:checked').value;
        const startDate = isChecked ? null : document.getElementById('fecha-inicio').value;
        const endDate = isChecked ? null : document.getElementById('fecha-fin').value;
        updateTimeSeriesChart(selectedCity, startDate, endDate);
    }
    
    document.getElementById('fecha-rango').innerText = isChecked ? "Visualizando todos los datos." : "";
            updateTimeSeriesChart(selectedCity, startDate, endDate);
});


//////////// GRAFICA DE REDUCCION DE DIMENSIONALIDADES ////////////

// Escuchar cambios en los radio buttons de ciudades
document.querySelectorAll('#city-checkboxes input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', updateUMAP);
});

// Escuchar cambios en el rango de fechas
document.getElementById('fecha-inicio').addEventListener('change', updateUMAP);
document.getElementById('fecha-fin').addEventListener('change', updateUMAP);

// Manejar el checkbox de "Visualizar todo"
document.getElementById('visualizar-todo').addEventListener('change', function () {
    const isChecked = this.checked;
    document.getElementById('fecha-inicio').disabled = isChecked;
    document.getElementById('fecha-fin').disabled = isChecked;
    updateUMAP();
    document.getElementById('fecha-rango').innerText = isChecked ? "Visualizando todos los datos." : "";
});

document.querySelectorAll('input[name="dimensionality"]').forEach(radio => {
    radio.addEventListener('change', (event) => {
        console.log("APRETANDO BOTÓN", event.target.value);
        dimensionality = event.target.value; // Actualiza la variable global
        updateUMAP(); // Llama a la función para actualizar los datos y la visualización
    });
});

let dimensionality = "umap2"; // Valor por defecto

async function fetchData(selectedCity) {
    const response = await fetch(`NEW_MODEL_DCAE/fusion/data_unida/real_data_${dimensionality}/${selectedCity}`);
    const data = await response.text();
    return d3.csvParse(data, d => ({
        year: +d.year,
        month: +d.month,
        day: +d.day,
        UMAP1: +d.UMAP1,
        UMAP2: +d.UMAP2,
        AQI: +d.AQI,
        Kmeans_3: +d.Kmeans_3,
        Kmeans_4: +d.Kmeans_4,
        Kmeans_6: +d.Kmeans_6,
        Kmeans_12: +d.Kmeans_12,
        PM2_5: +d.PM2_5,
        PM10: +d.PM10,
        SO2: +d.SO2,
        NO2: +d.NO2,
        CO: +d.CO,
        O3: +d.O3,
        TEMP: +d.TEMP,
        PRES: +d.PRES,
        DEWP: +d.DEWP,
        RAIN: +d.RAIN,
        WSPM: +d.WSPM,
        station: d.station,
        city: selectedCity
    }));
}

async function fetchDataCont(selectedCity) {
    const response = await fetch(`NEW_MODEL_DCAE/contaminantes/data_unida/real_data_${dimensionality}/${selectedCity}`);
    const data = await response.text();
    return d3.csvParse(data, d => ({
        year: +d.year,
        month: +d.month,
        day: +d.day,
        UMAP1: +d.UMAP1,
        UMAP2: +d.UMAP2,
        AQI: +d.AQI,
        Kmeans_3: +d.Kmeans_3,
        Kmeans_4: +d.Kmeans_4,
        Kmeans_6: +d.Kmeans_6,
        Kmeans_12: +d.Kmeans_12,
        PM2_5: +d.PM2_5,
        PM10: +d.PM10,
        SO2: +d.SO2,
        NO2: +d.NO2,
        CO: +d.CO,
        O3: +d.O3,
        TEMP: +d.TEMP,
        PRES: +d.PRES,
        DEWP: +d.DEWP,
        RAIN: +d.RAIN,
        WSPM: +d.WSPM,
        station: d.station,
        city: selectedCity
    }));
}

async function fetchDataMet(selectedCity) {
    const response = await fetch(`NEW_MODEL_DCAE/meteorologicos/data_unida/real_data_${dimensionality}/${selectedCity}`);
    const data = await response.text();
    return d3.csvParse(data, d => ({
        year: +d.year,
        month: +d.month,
        day: +d.day,
        UMAP1: +d.UMAP1,
        UMAP2: +d.UMAP2,
        AQI: +d.AQI,
        Kmeans_3: +d.Kmeans_3,
        Kmeans_4: +d.Kmeans_4,
        Kmeans_6: +d.Kmeans_6,
        Kmeans_12: +d.Kmeans_12,
        PM2_5: +d.PM2_5,
        PM10: +d.PM10,
        SO2: +d.SO2,
        NO2: +d.NO2,
        CO: +d.CO,
        O3: +d.O3,
        TEMP: +d.TEMP,
        PRES: +d.PRES,
        DEWP: +d.DEWP,
        RAIN: +d.RAIN,
        WSPM: +d.WSPM,
        station: d.station,
        city: selectedCity
    }));
}

async function updateUMAP() {
    // Obtener la ciudad seleccionada
    const selectedCity = document.querySelector('#city-checkboxes input[type="radio"]:checked')?.value;
    if (!selectedCity) {
        alert("Por favor, selecciona una ciudad.");
        return;
    }

    // Obtener las fechas seleccionadas
    const visualizarTodo = document.getElementById('visualizar-todo').checked;
    const fechaInicio = !visualizarTodo ? document.getElementById('fecha-inicio').value : null;
    const fechaFin = !visualizarTodo ? document.getElementById('fecha-fin').value : null;

    // Obtener y filtrar los datos
    const data = await fetchData(selectedCity);
    const data_cont = await fetchDataCont(selectedCity);
    const data_met = await fetchDataMet(selectedCity);
    const filteredData = filterData(data, fechaInicio, fechaFin);
    filteredDataCont = filterData(data_cont, fechaInicio, fechaFin); // Asignación a la variable global
    filterDataMet = filterData(data_met, fechaInicio, fechaFin);
    filterDataFusion = filterData(data, fechaInicio, fechaFin);
    const filteredDataMet = filterData(data_met, fechaInicio, fechaFin);

    // Crear el gráfico
    plotUMAP(filteredData, fechaInicio, fechaFin);
    plotUMAPcont(filteredDataCont, fechaInicio, fechaFin);
    plotUMAPmet(filteredDataMet, fechaInicio, fechaFin);
}

function filterData(data, startDate, endDate) {
    if (!startDate || !endDate) return data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return data.filter(d => {
        const date = new Date(d.year, d.month - 1, d.day);
        return date >= start && date <= end;
    });
}

let filteredDataCont = null; // Declaración global
let filterDataMet = null; // Declaración global
let filterDataFusion = null; // Declaración global

let isGraphLocked = false; // Inicialmente, la gráfica está desbloqueada.
let isGraphLocked2 = false; // Inicialmente, la gráfica está desbloqueada.
let isGraphLocked3 = false; // Inicialmente, la gráfica está desbloqueada.
let isGraphLocked_boton = true;
let isGraphLocked_boton2 = true;


function plotUMAP(data, fechaInicio, fechaFin) {

    d3.select("#umap-plot-fusion").selectAll("*").remove();


    // Colores para Kmeans_3
    const kmeans3Colors = {
        0: '#1b9e77',
        1: '#d95f02',
        2: '#7570b3',
    };

    // Colores para Kmeans_4
    const kmeans4Colors = {
        0: '#66c2a5',
        1: '#fc8d62',
        2: '#8da0cb',
        3: '#e78ac3',
    };

    // Colores para Kmeans_6
    const kmeans6Colors = {
        0: '#fdae61',
        1: '#fee08b',
        2: '#d73027',
        3: '#4575b4',
        4: '#313695',
        5: '#91bfdb',
    };

    // Colores para Kmeans_12
    const kmeans12Colors = {
        0: '#a6cee3',
        1: '#1f78b4',
        2: '#b2df8a',
        3: '#33a02c',
        4: '#fb9a99',
        5: '#e31a1c',
        6: '#fdbf6f',
        7: '#ff7f00',
        8: '#cab2d6',
        9: '#6a3d9a',
        10: '#ffff99',
        11: '#b15928',
    };

    // Colores para AQI
    const aqiColors = {
        1: '#00E400', // Bueno
        2: '#FFFF00', // Moderado
        3: '#FF7E00', // Insalubre
        4: '#FF0000', // Muy Insalubre
        5: '#99004c', // Malo
        6: '#800000', // Severo
    };

    // Función para actualizar la opacidad de los puntos del cluster seleccionado y agregar borde
    function updateClusterDisplay(clusterCount, selectedCluster, clusterColors) {
        svg.selectAll("circle")
            .attr("fill", d => clusterColors[d[`Kmeans_${clusterCount}`]]) // Relleno con el color del cluster
            .attr("opacity", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? 1 : 0.2) // Opacidad según selección
            .attr("stroke", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? "black" : "none") // Borde negro solo en el cluster seleccionado
            .attr("stroke-width", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? 1 : 0); // El borde negro tendrá grosor de 2 si está seleccionado, sino sin borde
    }

    function updateAQIDisplay() {
        // Obtener las fechas seleccionadas en los filtros activos
        const activeFilterDates = new Set(activeFilterData.map(d => `${d.year}-${d.month}-${d.day}`));
    
        svg.selectAll("circle")
            .attr("fill", d => aqiColors[d.AQI] === undefined ? '#000000' : aqiColors[d.AQI]) // Color por AQI
            .attr("opacity", d => activeFilterDates.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0.1); // Opacar los no seleccionados
    }
    
    document.getElementById("cluster-3-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.
        document.getElementById("cluster-3-btn").classList.remove("dimmed");
        document.getElementById("cluster-3-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");   
        document.getElementById("cluster-6-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        svg.selectAll("circle")
            .attr("fill", d => kmeans3Colors[d.Kmeans_3])
            .attr("opacity", 1);

        document.getElementById("cluster-3-select").disabled = false;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-3-select").value = "";
    });

    // Evento para el selector de cluster-12
    document.getElementById("cluster-12-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.
        document.getElementById("cluster-12-btn").classList.remove("dimmed");
        document.getElementById("cluster-12-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");   
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-6-select").classList.add("dimmed");
        

        svg.selectAll("circle")
            .attr("fill", d => kmeans12Colors[d.Kmeans_12])
            .attr("opacity", 1);

        document.getElementById("cluster-12-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").value = "";
    });
            
    // Evento para el botón de cluster-4
    document.getElementById("cluster-4-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.
        document.getElementById("cluster-4-btn").classList.remove("dimmed");
        document.getElementById("cluster-4-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-6-select").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])
            .attr("opacity", 1);

        document.getElementById("cluster-4-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-4-select").value = "";
    });

    // Evento para el botón de cluster-6
    document.getElementById("cluster-6-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.


        document.getElementById("cluster-6-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");

        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        svg.selectAll("circle")
            .attr("fill", d => kmeans6Colors[d.Kmeans_6])
            .attr("opacity", 1);

        document.getElementById("cluster-6-select").disabled = false;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-6-select").value = "";
    });

    let filteredClusterData = data;
    let activeFilterData = data;  // Solo un filtro activo a la vez (estación, año o mes)
    
    // Evento para el selector de cluster-12
    document.getElementById("cluster-12-select").addEventListener("change", function () {
        if (isGraphLocked2 || isGraphLocked3) return;
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_12 === selectedCluster);
        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];
        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans12Colors[selectedCluster];
        updateVisualization();
        updateClusterDisplay(12, selectedCluster, kmeans12Colors);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });

    // Evento para el selector de cluster-3
    document.getElementById("cluster-3-select").addEventListener("change", function () {
        if (isGraphLocked2 || isGraphLocked3) return;
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_3 === selectedCluster);
        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];
        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans3Colors[selectedCluster];
        updateVisualization();
        updateClusterDisplay(3, selectedCluster, kmeans3Colors);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });

    // Evento para el selector de cluster-4
    document.getElementById("cluster-4-select").addEventListener("change", function () {
        if (isGraphLocked2 || isGraphLocked3) return;

        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_4 === selectedCluster);

        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];

        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans4Colors[selectedCluster];

        // // Imprimir en consola las fechas y el color del cluster seleccionado
        // console.log("Fechas del Cluster seleccionado:", clusterDates);
        // console.log("Color del Cluster seleccionado:", clusterColor);

        updateVisualization();
        updateClusterDisplay(4, selectedCluster, kmeans4Colors);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });


    
    let filteredClusterData2 = data;
    let activeFilterData2 = data;  // Solo un filtro activo a la vez (estación, año o mes)

    // Evento para el selector de cluster-6
    document.getElementById("cluster-6-select").addEventListener("change", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.

        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData2 = data.filter(d => d.Kmeans_6 === selectedCluster);
        
        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData2.map(d => `${d.year}-${d.month}-${d.day}`))];

        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans6Colors[selectedCluster];

        // // Imprimir en consola las fechas y el color del cluster seleccionado
        // console.log("Fechas del Cluster seleccionado:", clusterDates);
        // console.log("Color del Cluster seleccionado:", clusterColor);

        updateVisualization2();
        updateClusterDisplay(6, selectedCluster, kmeans6Colors);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });

    // Evento para el botón AQI
    document.getElementById("aqi-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.


        document.getElementById("aqi-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-6-select").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        updateAQIDisplay(); // Actualiza la visualización de AQI
        updateButtonOpacity("aqi-btn");

    });

    // Función para actualizar la opacidad de los filtros
    function updateFilterOpacity(activeFilterId) {
        const filters = ["station-filter", "year-filter", "month-filter", "aqi-filter"];
        filters.forEach((filterId) => {
            const filterElement = document.getElementById(filterId);
            if (filterId === activeFilterId) {
                filterElement.classList.remove("dimmed");
            } else {
                filterElement.classList.add("dimmed");
            }
        });
    }

        
    // Función para determinar qué cluster está activo
    function getActiveClusterVisualizationFunction() {
        if (!document.getElementById("cluster-6-select").disabled) {
            return updateVisualization2; // Si cluster-6 está habilitado, usa updateVisualization2
        }
        if (!document.getElementById("cluster-4-select").disabled) {
            return updateVisualization; // Si cluster-4 está habilitado, usa updateVisualization
        }
        if (!document.getElementById("cluster-3-select").disabled) {
            return updateVisualization3; // Si cluster-3 está habilitado, usa updateVisualization3
        }
        if (!document.getElementById("cluster-12-select").disabled) {
            return updateVisualization4; // Si cluster-12 está habilitado, usa updateVisualization12
        }
    }

    // Evento para el filtro de estación del año
    document.getElementById('station-filter').addEventListener('change', (event) => {
        if (isGraphLocked2 || isGraphLocked3) return;

        const selectedSeason = event.target.value;
        activeFilterData = filterDataBySeason(selectedSeason, data); // Actualiza el único filtro activo
        activeFilterData2 = filterDataBySeason(selectedSeason, data); // Actualiza el único filtro activo

        highlightSeason(selectedSeason, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('station-filter');
    });

    // Evento para el filtro de año
    document.getElementById('year-filter').addEventListener('change', (event) => {
        if (isGraphLocked2 || isGraphLocked3) return;

        const selectedYear = parseInt(event.target.value, 10);
        activeFilterData = data.filter(d => d.year === selectedYear); // Solo un filtro activo a la vez
        activeFilterData2 = data.filter(d => d.year === selectedYear); // Solo un filtro activo a la vez

        highlightYear(selectedYear, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('year-filter');
    });

    // Evento para el filtro de mes
    document.getElementById('month-filter').addEventListener('change', (event) => {
        if (isGraphLocked2 || isGraphLocked3) return;

        const selectedMonth = event.target.value;
        activeFilterData = filterDataByMonth(selectedMonth, data); // Solo un filtro activo a la vez
        activeFilterData2 = filterDataByMonth(selectedMonth, data); // Solo un filtro activo a la vez

        highlightMonth(selectedMonth, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('month-filter');
    });

    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    function updateVisualization() {
        const clusterDates = new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates = new Set(activeFilterData.map(d => `${d.year}-${d.month}-${d.day}`));

        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates.has(date)));

        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData.filter(d => activeFilterDates.has(`${d.year}-${d.month}-${d.day}`));

        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) || 
                                activeFilterDates.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);

        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;

            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    function updateVisualization2() {
        const clusterDates = new Set(filteredClusterData2.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates2 = new Set(activeFilterData2.map(d => `${d.year}-${d.month}-${d.day}`));

        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates2.has(date)));

        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData2.filter(d => activeFilterDates2.has(`${d.year}-${d.month}-${d.day}`));

        svg.selectAll("circle")
            .attr("fill", d => kmeans6Colors[d.Kmeans_6])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) || 
                                activeFilterDates2.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);

        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;

            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    function updateVisualization3() {
        const clusterDates = new Set(filteredClusterData3.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates3 = new Set(activeFilterData3.map(d => `${d.year}-${d.month}-${d.day}`));
        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates3.has(date)));
        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData3.filter(d => activeFilterDates3.has(`${d.year}-${d.month}-${d.day}`));
        svg.selectAll("circle")
            .attr("fill", d => kmeans3Colors[d.Kmeans_3])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) ||
                                activeFilterDates3.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);
        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null; 
            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    function updateVisualization4() {
        const clusterDates = new Set(filteredClusterData4.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates4 = new Set(activeFilterData4.map(d => `${d.year}-${d.month}-${d.day}`));
        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates4.has(date)));
        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData4.filter(d => activeFilterDates4.has(`${d.year}-${d.month}-${d.day}`));
        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) ||
                                activeFilterDates4.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);
        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;
            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }   

    // Función para manejar la actualización de gráficos
    function handleSelectionUpdate(filteredData, selectedDates, fechaInicio, fechaFin) {
        if (selectedDates.length === 0) {
            console.warn("No hay fechas válidas seleccionadas.");
            return;
        }

        // console.log("Actualizando gráficos con fechas seleccionadas:", selectedDates);
        const cityFile = filteredData.length > 0 ? filteredData[0].city : null;

        updateTimeSeriesChart(cityFile, fechaInicio, fechaFin, selectedDates);
        updateCorrelationMatrixnew(selectedDates);
        drawThemeRiver(cityFile, selectedDates);
        updateRadialChartWithSelection(filteredData, fechaInicio, fechaFin);
        
    }

    // Función para filtrar datos por estación
    function filterDataBySeason(season, data) {
        const seasonRanges = {
            Primavera: { start: { month: 3, day: 20 }, end: { month: 6, day: 21 } },
            Verano: { start: { month: 6, day: 21 }, end: { month: 9, day: 22 } },
            Otoño: { start: { month: 9, day: 22 }, end: { month: 12, day: 21 } },
            Invierno: { start: { month: 12, day: 21 }, end: { month: 3, day: 20 } }
        };

        const range = seasonRanges[season];
        if (!range) return [];

        return data.filter(d => {
            const start = new Date(d.year, range.start.month - 1, range.start.day);
            const end = new Date(d.year, range.end.month - 1, range.end.day);
            const date = new Date(d.year, d.month - 1, d.day);

            return season === 'Invierno'
                ? (date >= start || date <= end)
                : (date >= start && date <= end);
        });
    }

    // Función para filtrar datos por mes
    function filterDataByMonth(month, data) {
        const monthMapping = {
            Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
            Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
        };
        const monthNumber = monthMapping[month];
        return data.filter(d => d.month === monthNumber);
    }

    // Dimensiones del contenedor
    const container = d3.select("#umap-plot-fusion");
    const width = container.node().clientWidth || 800; // Default width
    const height = container.node().clientHeight || 440; // Default height
        
    const svg = container.append("svg")
        .attr("transform", "translate(275, -390)") // Desplazamiento hacia la derecha y abajo
        .attr("width", "45%")
        .attr("height", "45%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "none") // Fondo transparente
        .style("position", "relative") // Asegura que el desplazamiento funcione correctamente
        .style("border", "1px solid black") // Agrega un borde negro de 2px
        .style("border-radius", "10px") // Bordes redondeados
        .on("contextmenu", (event) => event.preventDefault());
    // Agregar título en la parte superior izquierda
    svg.append("text")
        .attr("x", 53) // Posición horizontal (izquierda)
        .attr("y", 30) // Posición vertical (arriba)
        .attr("font-size", "30px") // Tamaño de la fuente
        .attr("font-weight", "bold") // Negrita
        .attr("fill", "black") // Color del texto
        .text("Fusion de datos");

    // Agregar un checkbox al lado del título
    const checkbox = d3.select("#umap-plot-fusion")
    .append("input")
    .attr("type", "checkbox")
    .attr("id", "toggle-umap-fusion")
    .style("position", "absolute")
    .style("left", "295px") // Ajusta la posición respecto al contenedor
    .style("top", "225px") // Ajusta la posición respecto al contenedor
    .property("checked", false); // Inicia desmarcado

    // Función para resaltar el borde cuando el checkbox esté marcado
    d3.select("#toggle-umap-fusion").on("change", function () {
    const isChecked = d3.select(this).property("checked");
// Estado inicial bloqueado
    // Cambiar el borde del SVG dependiendo del estado del checkbox
    if (isChecked) {
        svg.style("border", "1px solid #ff6347"); // Borde resaltado con color cuando está seleccionado
        enableClusterAndAQIControls(); // Habilitar botones de clusters y AQI
        isGraphLocked = true; // Bloquear gráfica
        isGraphLocked_boton = false;
        d3.selectAll(".legend-item-pca, .reset-button-pca")
        .style("pointer-events", "all")
        .style("opacity", "1") // Habilitar botones
        .style("display", "block"); // Mostrar botones de nuevo


    } else {
        svg.style("border", "1px solid black"); // Borde normal cuando no está seleccionado
        disableClusterAndAQIControls(); // Deshabilitar botones de clusters y AQI
        isGraphLocked = false; // Desbloquear gráfica
        isGraphLocked_boton = true;
        d3.selectAll(".legend-item-pca, .reset-button-pca")
        .style("pointer-events", "none")
        .style("opacity", "0.5")
        .style("display", "none"); // Ocultar botones

        d3.selectAll(".legend-item-pca2, .reset-button-pca2")
        .style("pointer-events", "all")
        .style("opacity", "1") // Habilitar botones
        .style("display", "block"); // Mostrar botones de nuevo
        
        

    }
    });

    // Función para habilitar los controles de clusters y AQI
    function enableClusterAndAQIControls() {
    document.getElementById("cluster-4-btn").disabled = false;
    document.getElementById("cluster-6-btn").disabled = false;
    document.getElementById("cluster-3-btn").disabled = false;
    document.getElementById("cluster-12-btn").disabled = false;
    document.getElementById("aqi-btn").disabled = false;
    document.getElementById("cluster-4-select").disabled = false;
    document.getElementById("cluster-6-select").disabled = false;
    document.getElementById("cluster-3-select").disabled = false;
    document.getElementById("cluster-12-select").disabled = false;
    document.getElementById("aqi-btn").classList.remove("dimmed");
    document.getElementById("cluster-4-btn").classList.remove("dimmed");
    document.getElementById("cluster-6-btn").classList.remove("dimmed");
    document.getElementById("cluster-3-btn").classList.remove("dimmed");
    document.getElementById("cluster-12-btn").classList.remove("dimmed");
    }

    // Función para deshabilitar los controles de clusters y AQI
    function disableClusterAndAQIControls() {
    document.getElementById("cluster-4-btn").disabled = true;
    document.getElementById("cluster-6-btn").disabled = true;
    document.getElementById("cluster-3-btn").disabled = true;
    document.getElementById("cluster-12-btn").disabled = true;
    document.getElementById("aqi-btn").disabled = true;
    document.getElementById("cluster-4-select").disabled = true;
    document.getElementById("cluster-6-select").disabled = true;
    document.getElementById("cluster-3-select").disabled = true;
    document.getElementById("cluster-12-select").disabled = true;
    document.getElementById("aqi-btn").classList.add("dimmed");
    document.getElementById("cluster-4-btn").classList.add("dimmed");
    document.getElementById("cluster-6-btn").classList.add("dimmed");
    document.getElementById("cluster-3-btn").classList.add("dimmed");
    document.getElementById("cluster-12-btn").classList.add("dimmed");
    }

    // Inicializar en el estado deshabilitado
    disableClusterAndAQIControls();


    // Grupo para aplicar zoom
    const g = svg.append("g");

    // Escalas
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP1))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP2))
        .range([height, 0]);

    // Colores según el nivel de AQI
    const colorScale = d3.scaleOrdinal()
        .domain([1, 2, 3, 4, 5, 6])
        .range(['#00E400', '#FFFF00', '#FF7E00', '#FF0000', '#99004c', '#800000']);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    // Dibujar puntos
    g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.UMAP1))
        .attr("cy", d => yScale(d.UMAP2))
        .attr("r", 6)
        .attr("fill", d => colorScale(d.AQI))
        .attr("opacity", 1)
        .attr("stroke", "none")  // Sin borde inicialmente
            // Agregar manejador para el filtro de estación

          .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Ciudad:</strong> ${d.city.replace('Data_', '').replace('.csv', '')}<br>
                    <strong>Fecha:</strong> ${d.day}/${d.month}/${d.year}<br>
                    <strong>AQI:</strong> ${d.AQI}
                `);

            d3.select(this)
                .attr("r", 10)
                .attr("stroke-width", 1);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.style("visibility", "hidden");

            d3.select(this)
                .attr("r", 6)
                .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0); 
        });
        
        function highlightSeason(season, data, svg, xScale, yScale) {
            // Definir rangos de fechas para cada estación
            const seasonRanges = {
                Primavera: { start: { month: 3, day: 20 }, end: { month: 6, day: 21 } },
                Verano: { start: { month: 6, day: 21 }, end: { month: 9, day: 22 } },
                Otoño: { start: { month: 9, day: 22 }, end: { month: 12, day: 21 } },
                Invierno: { start: { month: 12, day: 21 }, end: { month: 3, day: 20 } },
            };
        
            const range = seasonRanges[season];
            if (!range) return;
        
            function isInSeason(d) {
                const start = new Date(d.year, range.start.month - 1, range.start.day);
                const end = new Date(d.year, range.end.month - 1, range.end.day);
                const date = new Date(d.year, d.month - 1, d.day);
        
                if (season === 'Invierno') {
                    return (
                        (date >= start && d.month >= 12) || 
                        (d.month <= 3 && date <= end)
                    );
                }
        
                return date >= start && date <= end;
            }
        
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => isInSeason(d))
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("r", 8);
        }
        
        function highlightYear(year, data, svg, xScale, yScale) {
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => d.year === year)
                .attr("stroke", "blue")
                .attr("stroke-width", 1)
                .attr("r", 8);
        }
        
        function highlightMonth(month, data, svg, xScale, yScale) {
            const months = {
                Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
                Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
            };
        
            const monthNumber = months[month];
            if (!monthNumber) return;
        
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => d.month === monthNumber)
                .attr("stroke", "blue")
                .attr("stroke-width", 1)
                .attr("r", 8);
        }
    // Variables para la selección
    let isDrawing = false;
    let points = [];
    let selectionLine; // Para almacenar la línea de selección

    // Zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);
    const initialTransform = d3.zoomIdentity.translate(width / 9.5, height / 9).scale(0.79);
    svg.call(zoom).call(zoom.transform, initialTransform);

    svg.on("mousedown", (event) => {
        if (event.button !== 2) return; // Solo activar con anticlick (botón derecho del mouse)

        // Limpiar la selección anterior
        if (selectionLine) {
            selectionLine.remove();
        }

        isDrawing = true;
        points = []; // Reiniciar puntos

        const [startX, startY] = d3.pointer(event, g.node());
        points.push([startX, startY]);

        // Crear línea inicial
        selectionLine = g.append("polyline")
            .attr("fill", "rgba(100, 100, 255, 0.3)")
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("points", points.join(" "));

        svg.on("mousemove", (event) => {
            if (!isDrawing) return;

            const [currentX, currentY] = d3.pointer(event, g.node());
            points.push([currentX, currentY]);
            selectionLine.attr("points", points.join(" "));
        });
    });

    svg.on("mouseup", () => {
        if (!isDrawing) return;

        isDrawing = false;

        // Unir el último punto con el primero
        points.push(points[0]); // Añadir el primer punto al final para cerrar el polígono
        selectionLine.attr("points", points.join(" ")); // Actualizar la línea para incluir el cierre

        // Filtrar los puntos seleccionados dentro del polígono
        const selectionData = data.filter(d => {
            const x = xScale(d.UMAP1);
            const y = yScale(d.UMAP2);
            return d3.polygonContains(points, [x, y]); // Verificar si el punto está dentro del polígono
        });

        // Verificar si hay datos seleccionados
        if (selectionData.length === 0) {
            console.warn("No se seleccionaron puntos dentro del área.");
            return;
        }

        // Construir el arreglo de fechas seleccionadas
        const selectedDates = selectionData.map(d => `${d.year}-${d.month}-${d.day}`);

        // Verifica que haya fechas válidas en `selectedDates`
        if (selectedDates.length === 0) {
            console.warn("No hay fechas válidas en los datos seleccionados.");
            return;
        }

        // Obtener el archivo de la ciudad seleccionada
        const cityFile = selectionData[0].city;

        // Llamar a las funciones con las fechas seleccionadas
        updateTimeSeriesChart(cityFile, fechaInicio, fechaFin, selectedDates);
        updateCorrelationMatrixnew(selectedDates);
        drawThemeRiver(cityFile, selectedDates);
        updateRadialChartWithSelection(selectionData, fechaInicio, fechaFin);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, selectedDates, "aqi");
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, selectedDates, "aqi");
        // Restaurar todos los puntos a su estado original antes de aplicar cambios a los puntos seleccionados
        svg.selectAll("circle")
            .attr("r", 6)  // Restaurar el radio original de los puntos (ajusta según el tamaño original)
            .attr("stroke", "none");  // Eliminar el borde azul

        // Hacer los puntos seleccionados más grandes y agregar un borde azul
        selectionData.forEach(d => {
            const x = xScale(d.UMAP1);
            const y = yScale(d.UMAP2);
            // Buscar el círculo correspondiente y cambiar su radio y agregar un borde
            svg.selectAll("circle")
                .filter(function() {
                    const cx = parseFloat(this.getAttribute("cx"));
                    const cy = parseFloat(this.getAttribute("cy"));
                    return cx === x && cy === y;
                })
                .attr("r", 8)  // Cambiar el tamaño del radio
                .attr("stroke", "blue")  // Agregar borde azul
                .attr("stroke-width", 3);  // Establecer el grosor del borde
        });
    });

    // Agregar la leyenda como botones
    const legendData = [
        { color: '#00E400', label: 'Bueno', AQI: 1 },
        { color: '#FFFF00', label: 'Moderado', AQI: 2 },
        { color: '#FF7E00', label: 'Insalubre', AQI: 3 },
        { color: '#FF0000', label: 'Muy Insalubre', AQI: 4 },
        { color: '#99004c', label: 'Malo', AQI: 5 },
        { color: '#800000', label: 'Severo', AQI: 6 },
    ];

    // Crear la leyenda como botones, asegurando que esté delante de otros elementos
    if (container.select('.legend-pca').empty()) {
        const legend = container.insert('div', ':first-child')
            .attr('class', 'legend-pca')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('align-items', 'center')
            .style('position', 'absolute')
            .style('bottom', '-1%') // Coloca la leyenda en la parte inferior del contenedor
            .style('left', '4%')
            .style('width', '90%') // Ajusta el ancho disponible
            .style('height', 'auto')
            .style('font-family', 'Arial, sans-serif')
            .style('font-weight', 'bold')
            .style('z-index', '1000') // Asegura que esté encima de cualquier cosa
            .style('pointer-events', 'all') // Permite interacciones con los botones
            .style('border-radius', '10px')
            .style('padding', '10px') // Espaciado interno para los botones
            .style('text-align', 'center');  // Centrar el texto

        legendData.forEach((item, index) => {
            const legendButton = legend.append('button')
                .attr('class', 'legend-item-pca')
                .style('background-color', item.color)
                .style('padding', '3px 10px')
                .style('margin', '0 4px')
                .style('border-radius', '5px')
                .style('color', index > 3 ? 'white' : 'black') // Texto blanco para "Malo" y "Severo"
                .style('border', 'none')
                .style('cursor', 'pointer')
                .style('font-weight', 'bold')
                .style('text-align', 'center')  // Centrar el texto
                .style('font-size', '11px')
                .style('box-shadow', '0px 2px 5px rgba(0, 0, 0, 0.3)') // Sombra para resaltar los botones
                .text(item.label);

            // Cambiar la opacidad y agregar borde en hover
            legendButton
                .on('mouseover', () => {
                    legendButton.style('box-shadow', '0px 0px 5px 2px rgba(0,0,0,0.5)');
                })
                .on('mouseout', () => {
                    if (!legendButton.classed('selected')) {
                        legendButton.style('box-shadow', 'none');
                    }
                });

            // Filtrar puntos al hacer clic
            legendButton.on('click', () => {
                // Quitar la sombra de todos los botones y restablecer tamaño
                if (isGraphLocked_boton) return; // Evitar interacción si está bloqueado

                legend.selectAll('button')
                    .style('box-shadow', 'none')
                    .style('transform', 'scale(1)')
                    .style('opacity', '0.7')  // Reducir opacidad de los otros botones
                    .classed('selected', false);
                
                // Agregar la clase 'selected' al botón clickeado para aplicar la sombra
                legendButton.style('box-shadow', '0px 0px 5px 2px rgba(0,0,0,0.5)')
                    .style('transform', 'scale(1.1)') // Hacer que el botón crezca un poco
                    .style('opacity', '1')  // El botón seleccionado no pierde opacidad
                    .classed('selected', true);

                const selectedAQI = index + 1; // AQI corresponde al índice + 1

                // Filtrar puntos en el gráfico UMAP
                svg.selectAll('circle')
                    .attr('opacity', d => (d.AQI === selectedAQI ? 1 : 0.1));

                // Filtrar datos para otras visualizaciones
                const selectedData = data.filter(d => d.AQI === selectedAQI);
                const selectedDates = selectedData.map(d => `${d.year}-${d.month}-${d.day}`);

                // Actualizar otras gráficas con los datos seleccionados
                updateTimeSeriesChart(selectedData[0]?.city, fechaInicio, fechaFin, selectedDates);
                updateCorrelationMatrixnew(selectedDates);
                drawThemeRiver(selectedData[0]?.city, selectedDates);
                updateRadialChartWithSelection(selectedData, fechaInicio, fechaFin);
            });
        });

        // Agregar un botón para resetear el filtro
        legend.append('button')
            .attr('class', 'reset-button-pca')
            .style('background-color', '#ccc')
            .style('padding', '5px 15px')
            .style('margin', '0 5px')
            .style('border-radius', '5px')
            .style('color', 'black')
            .style('border', 'none')
            .style('cursor', 'pointer')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('box-shadow', '0px 2px 5px rgba(0, 0, 0, 0.3)') // Sombra para resaltar el botón
            .text('Resetear')
            .on('mouseover', function () {
                d3.select(this).style('box-shadow', '0px 0px 5px 2px rgba(0,0,0,0.5)');
            })
            .on('mouseout', function () {
                d3.select(this).style('box-shadow', 'none');
            })
            .on('click', () => {
                // Resetear opacidad de todos los puntos
                svg.selectAll('circle')
                    .attr('opacity', 1);

                // Eliminar la sombra de todos los botones y quitar la clase 'selected'
                legend.selectAll('button')
                    .style('box-shadow', 'none')
                    .style('transform', 'scale(1)')
                    .style('opacity', '1')  // Restaurar opacidad original
                    .classed('selected', false);
            });
    }

}



function plotUMAPmetCluster(data, fechaInicio, fechaFin, clusterDates, clusterColor) {
    // Limpiar el gráfico anterior
    d3.select("#umap-plot-meteorologia").selectAll("*").remove();
    // console.log("Datos de entrada del cluster seleccionado - Fechas:", clusterDates);
    // console.log("Color del Cluster seleccionado:", clusterColor);
    
    // Dimensiones del contenedor
    const container = d3.select("#umap-plot-meteorologia");
    const width = container.node().clientWidth || 800; // Default width
    const height = container.node().clientHeight || 440; // Default height

    const svg = container.append("svg")
        .attr("transform", "translate(27, -185)") // Desplazamiento hacia la derecha y abajo
        .attr("width", "45%")
        .attr("height", "45%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "none") // Fondo transparente
        .style("position", "relative") // Asegura que el desplazamiento funcione correctamente
        .style("border", "1px solid black") // Agrega un borde negro de 2px
        .style("border-radius", "10px") // Bordes redondeados
        .on("contextmenu", (event) => event.preventDefault());
    // Agregar título en la parte superior izquierda
    svg.append("text")
        .attr("x", 53) // Posición horizontal (izquierda)
        .attr("y", 30) // Posición vertical (arriba)
        .attr("font-size", "30px") // Tamaño de la fuente
        .attr("font-weight", "bold") // Negrita
        .attr("fill", "black") // Color del texto
        .text("Meteorologicos");

    // Agregar un checkbox al lado del título
    const checkbox = d3.select("#umap-plot-meteorologia")
        .append("input")
        .attr("type", "checkbox")
        .attr("id", "toggle-umap-meteorologia")
        .style("position", "absolute")
        .style("left", "47px") // Ajusta la posición respecto al contenedor
        .style("top", "225px") // Ajusta la posición respecto al contenedor
        .property("checked", false); // Inicia desmarcado
    // Escalas para los ejes
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP1))
        .range([50, width - 50]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP2))
        .range([height - 50, 50]);

    // Crear el conjunto de fechas destacadas
    const clusterDateSet = new Set(clusterDates);
    // Crear tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    // Dibujar los puntos
    // Colores para AQI
    const aqiColors = {
        1: '#00E400', // Bueno
        2: '#FFFF00', // Moderado
        3: '#FF7E00', // Insalubre
        4: '#FF0000', // Muy Insalubre
        5: '#99004c', // Malo
        6: '#800000', // Severo
    };
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.UMAP1))
        .attr("cy", d => yScale(d.UMAP2))
        .attr("r", 5)
        .attr("fill", d => {
            if (clusterDateSet.has(`${d.year}-${d.month}-${d.day}`)) {
                if (clusterColor === "aqi") {
                    return aqiColors[d.AQI] || "#000";
                } else {
                    return clusterColor;
                }
            } else {
                return "steelblue";
            }
        })
        .attr("opacity", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0.2)
        .attr("stroke", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none")
        .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0)
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Ciudad:</strong> ${d.city.replace('Data_', '').replace('.csv', '')}<br>
                    <strong>Fecha:</strong> ${d.day}/${d.month}/${d.year}<br>
                    <strong>AQI:</strong> ${d.AQI}
                `);
            d3.select(this)
                .attr("r", 10)
                .attr("stroke-width", 3);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.style("visibility", "hidden");
            d3.select(this)
                .attr("r", 6)
                .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0); 
        });
        
    // Agregar zoom
    const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", (event) => {
        svg.selectAll("circle").attr("transform", event.transform);
    });

    svg.call(zoom);
    const initialTransform = d3.zoomIdentity.translate(width / 9.5, height / 9).scale(0.79);
    svg.call(zoom).call(zoom.transform, initialTransform);

    // Evento del checkbox
    d3.select("#toggle-umap-meteorologia").on("change", function () {
        const isChecked = d3.select(this).property("checked");

        // Limpiar el gráfico actual
        d3.select("#umap-plot-meteorologia").selectAll("*").remove();

        if (isChecked) {
            svg.style("border", "1px solid #ff6347"); // Borde resaltado con color
            enableClusterAndAQIControls3(); // Habilitar botones

            // Llamar a la nueva función cuando el checkbox está activado
            plotUMAPmet(data, fechaInicio, fechaFin);

        } else {
            svg.style("border", "1px solid black"); // Borde normal
            disableClusterAndAQIControls3(); // Deshabilitar botones

            // Volver a la función original cuando el checkbox está desactivado
            plotUMAPmetCluster(data, fechaInicio, fechaFin, clusterDates, clusterColor);
        }
    });


    // Función para habilitar los controles de clusters y AQI
    function enableClusterAndAQIControls3() {
        document.getElementById("cluster-4-btn").disabled = false;
        document.getElementById("cluster-6-btn").disabled = false;
        document.getElementById("cluster-3-btn").disabled = false;
        document.getElementById("cluster-12-btn").disabled = false;
        document.getElementById("aqi-btn").disabled = false;
        document.getElementById("cluster-4-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = false;
        document.getElementById("cluster-3-select").disabled = false;
        document.getElementById("cluster-12-select").disabled = false;
        document.getElementById("aqi-btn").classList.remove("dimmed");
        document.getElementById("cluster-4-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-btn").classList.remove("dimmed");
        document.getElementById("cluster-3-btn").classList.remove("dimmed");
        document.getElementById("cluster-12-btn").classList.remove("dimmed");

        }
    
        // Función para deshabilitar los controles de clusters y AQI
        function disableClusterAndAQIControls3() {
        document.getElementById("cluster-4-btn").disabled = true;
        document.getElementById("cluster-6-btn").disabled = true;
        document.getElementById("cluster-3-btn").disabled = true;
        document.getElementById("cluster-12-btn").disabled = true;
        document.getElementById("aqi-btn").disabled = true;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        }
}


function plotUMAPfusionCluster(data, fechaInicio, fechaFin, clusterDates, clusterColor) {
    // Limpiar el gráfico anterior
    d3.select("#umap-plot-fusion").selectAll("*").remove();
    // console.log("DGAAAAAAAAAAAAAAAAAAAA:")

    // Dimensiones del contenedor
    const container = d3.select("#umap-plot-fusion");
    const width = container.node().clientWidth || 800; // Default width
    const height = container.node().clientHeight || 440; // Default height

    const svg = container.append("svg")
        .attr("transform", "translate(275, -390)") // Desplazamiento hacia la derecha y abajo
        .attr("width", "45%")
        .attr("height", "45%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "none") // Fondo transparente
        .style("position", "relative") // Asegura que el desplazamiento funcione correctamente
        .style("border", "1px solid black") // Agrega un borde negro
        .style("border-radius", "10px") // Bordes redondeados
        .on("contextmenu", (event) => event.preventDefault());

    // Agregar título en la parte superior izquierda
    svg.append("text")
        .attr("x", 53) // Posición horizontal (izquierda)
        .attr("y", 30) // Posición vertical (arriba)
        .attr("font-size", "30px") // Tamaño de la fuente
        .attr("font-weight", "bold") // Negrita
        .attr("fill", "black") // Color del texto
        .text("Fusion de Datos");

    // Agregar un checkbox al lado del título
    d3.select("#umap-plot-fusion")
        .append("input")
        .attr("type", "checkbox")
        .attr("id", "toggle-umap-fusion")
        .style("position", "absolute")
        .style("left", "295px") // Ajusta la posición respecto al contenedor
        .style("top", "225px") // Ajusta la posición respecto al contenedor
        .property("checked", false); // Inicia desmarcado

    // Escalas para los ejes
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP1))
        .range([50, width - 50]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP2))
        .range([height - 50, 50]);

    // Crear el conjunto de fechas destacadas
    const clusterDateSet = new Set(clusterDates);
    // Crear tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    // Dibujar los puntos
    // Colores para AQI
    const aqiColors = {
        1: '#00E400', // Bueno
        2: '#FFFF00', // Moderado
        3: '#FF7E00', // Insalubre
        4: '#FF0000', // Muy Insalubre
        5: '#99004c', // Malo
        6: '#800000', // Severo
    };
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.UMAP1))
        .attr("cy", d => yScale(d.UMAP2))
        .attr("r", 5)
        .attr("fill", d => {
            if (clusterDateSet.has(`${d.year}-${d.month}-${d.day}`)) {
                if (clusterColor === "aqi") {
                    return aqiColors[d.AQI] || "#000";
                } else {
                    return clusterColor;
                }
            } else {
                return "steelblue";
            }
        })
        .attr("opacity", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0.2)
        .attr("stroke", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none")
        .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0)
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Ciudad:</strong> ${d.city.replace('Data_', '').replace('.csv', '')}<br>
                    <strong>Fecha:</strong> ${d.day}/${d.month}/${d.year}<br>
                    <strong>AQI:</strong> ${d.AQI}
                `);
            d3.select(this)
                .attr("r", 10)
                .attr("stroke-width", 3);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.style("visibility", "hidden");
            d3.select(this)
                .attr("r", 6)
                .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0); 
        });

    // Agregar zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", (event) => {
            svg.selectAll("circle").attr("transform", event.transform);
        });

    svg.call(zoom);
    const initialTransform = d3.zoomIdentity.translate(width / 9.5, height / 9).scale(0.79);
    svg.call(zoom).call(zoom.transform, initialTransform);
       // Evento del checkbox
    d3.select("#toggle-umap-fusion").on("change", function () {
        const isChecked = d3.select(this).property("checked");

        // Limpiar el gráfico actual
        d3.select("#umap-plot-fusion").selectAll("*").remove();

        if (isChecked) {
            svg.style("border", "1px solid #ff6347"); // Borde resaltado con color
            enableClusterAndAQIControls(); // Habilitar botones
            isGraphLocked = true;
            isGraphLocked_boton = false;
            d3.selectAll(".legend-item-pca2, .reset-button-pca2")
                .style("pointer-events", "all")
                .style("opacity", "1")
                .style("display", "block");

            // Llamar a la nueva función cuando el checkbox está activado
            plotUMAP(data, fechaInicio, fechaFin);

        } else {
            svg.style("border", "1px solid black"); // Borde normal
            disableClusterAndAQIControls(); // Deshabilitar botones
            isGraphLocked = false;
            isGraphLocked_boton = true;
            d3.selectAll(".legend-item-pca2, .reset-button-pca2")
                .style("pointer-events", "none")
                .style("opacity", "0.5");

            // Volver a la función original cuando el checkbox está desactivado
            plotUMAPfusionCluster(data, fechaInicio, fechaFin, clusterDates, clusterColor);
        }
});


    // Función para habilitar los controles de clusters y AQI
    function enableClusterAndAQIControls() {
    document.getElementById("cluster-4-btn").disabled = false;
    document.getElementById("cluster-6-btn").disabled = false;
    document.getElementById("cluster-3-btn").disabled = false;
    document.getElementById("cluster-12-btn").disabled = false;
    document.getElementById("aqi-btn").disabled = false;
    document.getElementById("cluster-4-select").disabled = false;
    document.getElementById("cluster-6-select").disabled = false;
    document.getElementById("cluster-3-select").disabled = false;
    document.getElementById("cluster-12-select").disabled = false;
    document.getElementById("aqi-btn").classList.remove("dimmed");
    document.getElementById("cluster-4-btn").classList.remove("dimmed");
    document.getElementById("cluster-6-btn").classList.remove("dimmed");
    document.getElementById("cluster-3-btn").classList.remove("dimmed");
    document.getElementById("cluster-12-btn").classList.remove("dimmed");
    }

    // Función para deshabilitar los controles de clusters y AQI
    function disableClusterAndAQIControls() {
    document.getElementById("cluster-4-btn").disabled = true;
    document.getElementById("cluster-6-btn").disabled = true;
    document.getElementById("cluster-3-btn").disabled = true;
    document.getElementById("cluster-12-btn").disabled = true;
    document.getElementById("aqi-btn").disabled = true;
    document.getElementById("cluster-4-select").disabled = true;
    document.getElementById("cluster-6-select").disabled = true;
    document.getElementById("cluster-3-select").disabled = true;
    document.getElementById("cluster-12-select").disabled = true;
    document.getElementById("aqi-btn").classList.add("dimmed");
    document.getElementById("cluster-4-btn").classList.add("dimmed");
    document.getElementById("cluster-6-btn").classList.add("dimmed");
    document.getElementById("cluster-3-btn").classList.add("dimmed");
    document.getElementById("cluster-12-btn").classList.add("dimmed");
    }

}

function plotUMAPcontCluster(data, fechaInicio, fechaFin, clusterDates, clusterColor) {
    // Limpiar el gráfico anterior
    d3.select("#umap-plot-contaminacion").selectAll("*").remove();
    console.log("Datos de entrada del cluster seleccionado - Fechas:", clusterDates);
    console.log("Color del Cluster seleccionado:", clusterColor);

    // Dimensiones del contenedor
    const container = d3.select("#umap-plot-contaminacion");
    const width = container.node().clientWidth || 800; // Default width
    const height = container.node().clientHeight || 440; // Default height

    const svg = container.append("svg")
        .attr("transform", "translate(275, -190)") // Desplazamiento hacia la derecha y abajo
        .attr("width", "45%")
        .attr("height", "45%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "none") // Fondo transparente
        .style("position", "relative")
        .style("border", "1px solid black") // Agrega un borde negro
        .style("border-radius", "10px")
        .on("contextmenu", (event) => event.preventDefault());

    // Agregar título
    svg.append("text")
        .attr("x", 53)
        .attr("y", 30)
        .attr("font-size", "30px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .text("Contaminantes");

    // Agregar checkbox
    d3.select("#umap-plot-contaminacion")
        .append("input")
        .attr("type", "checkbox")
        .attr("id", "toggle-umap-contaminacion")
        .style("position", "absolute")
        .style("left", "295px")
        .style("top", "16px")
        .property("checked", false);

    // Escalas para los ejes
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP1))
        .range([50, width - 50]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP2))
        .range([height - 50, 50]);

    // Conjunto de fechas destacadas
    const clusterDateSet = new Set(clusterDates);

    // Crear tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    // Dibujar los puntos
    // Colores para AQI
    const aqiColors = {
        1: '#00E400', // Bueno
        2: '#FFFF00', // Moderado
        3: '#FF7E00', // Insalubre
        4: '#FF0000', // Muy Insalubre
        5: '#99004c', // Malo
        6: '#800000', // Severo
    };
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.UMAP1))
        .attr("cy", d => yScale(d.UMAP2))
        .attr("r", 6)
        .attr("fill", d => {
            if (clusterDateSet.has(`${d.year}-${d.month}-${d.day}`)) {
                if (clusterColor === "aqi") {
                    return aqiColors[d.AQI] || "#000";
                } else {
                    return clusterColor;
                }
            } else {
                return "steelblue";
            }
        })
        .attr("opacity", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0.2)
        .attr("stroke", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none")
        .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0)
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Ciudad:</strong> ${d.city.replace('Data_', '').replace('.csv', '')}<br>
                    <strong>Fecha:</strong> ${d.day}/${d.month}/${d.year}<br>
                    <strong>AQI:</strong> ${d.AQI}
                `);
            d3.select(this)
                .attr("r", 10)
                .attr("stroke-width", 3);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.style("visibility", "hidden");
            d3.select(this)
                .attr("r", 6)
                .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0); 
        });

    // Agregar zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", (event) => {
            svg.selectAll("circle").attr("transform", event.transform);
        });

    svg.call(zoom);
    const initialTransform = d3.zoomIdentity.translate(width / 9.5, height / 9).scale(0.79);
    svg.call(zoom).call(zoom.transform, initialTransform);

    // Evento del checkbox
    d3.select("#toggle-umap-contaminacion").on("change", function () {
        const isChecked = d3.select(this).property("checked");

        // Limpiar el gráfico actual
        d3.select("#umap-plot-contaminacion").selectAll("*").remove();

        if (isChecked) {
            svg.style("border", "1px solid #ff6347");
            enableClusterAndAQIControls2();
            isGraphLocked2 = true;
            isGraphLocked_boton2 = false;
            d3.selectAll(".legend-item-pca2, .reset-button-pca2")
                .style("pointer-events", "all")
                .style("opacity", "1")
                .style("display", "block");

            plotUMAPcont(data, fechaInicio, fechaFin);
        } else {
            svg.style("border", "1px solid black");
            disableClusterAndAQIControls2();
            isGraphLocked2 = false;
            isGraphLocked_boton2 = true;
            d3.selectAll(".legend-item-pca2, .reset-button-pca2")
                .style("pointer-events", "none")
                .style("opacity", "0.5");

            plotUMAPcontCluster(data, fechaInicio, fechaFin, clusterDates, clusterColor);
        }
    });

    // Función para habilitar controles
    function enableClusterAndAQIControls2() {
        document.getElementById("cluster-4-btn").disabled = false;
        document.getElementById("cluster-6-btn").disabled = false;
        document.getElementById("cluster-3-btn").disabled = false;
        document.getElementById("cluster-12-btn").disabled = false;
        document.getElementById("aqi-btn").disabled = false;
        document.getElementById("cluster-4-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = false;
        document.getElementById("cluster-3-select").disabled = false;
        document.getElementById("cluster-12-select").disabled = false;
        document.getElementById("aqi-btn").classList.remove("dimmed");
        document.getElementById("cluster-4-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-btn").classList.remove("dimmed");
        document.getElementById("cluster-3-btn").classList.remove("dimmed");
        document.getElementById("cluster-12-btn").classList.remove("dimmed");
    }

    // Función para deshabilitar controles
    function disableClusterAndAQIControls2() {
        document.getElementById("cluster-4-btn").disabled = true;
        document.getElementById("cluster-6-btn").disabled = true;
        document.getElementById("cluster-3-btn").disabled = true;
        document.getElementById("cluster-12-btn").disabled = true;
        document.getElementById("aqi-btn").disabled = true;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
    }
}


function plotUMAPcont(data, fechaInicio, fechaFin) {
    // Limpiar el gráfico anterior
    d3.select("#umap-plot-contaminacion").selectAll("*").remove();
    // console.log("Fechas de entrada:", fechaInicio, fechaFin);

    // Colores para Kmeans_3
    const kmeans3Colors = {
        0: '#1b9e77',
        1: '#d95f02',
        2: '#7570b3',
    };

    // Colores para Kmeans_4
    const kmeans4Colors = {
        0: '#66c2a5',
        1: '#fc8d62',
        2: '#8da0cb',
        3: '#e78ac3',
    };

    // Colores para Kmeans_6
    const kmeans6Colors = {
        0: '#fdae61',
        1: '#fee08b',
        2: '#d73027',
        3: '#4575b4',
        4: '#313695',
        5: '#91bfdb',
    };

    // Colores para Kmeans_12
    const kmeans12Colors = {
        0: '#a6cee3',
        1: '#1f78b4',
        2: '#b2df8a',
        3: '#33a02c',
        4: '#fb9a99',
        5: '#e31a1c',
        6: '#fdbf6f',
        7: '#ff7f00',
        8: '#cab2d6',
        9: '#6a3d9a',
        10: '#ffff99',
        11: '#b15928',
    };

    // Colores para AQI
    const aqiColors = {
        1: '#00E400', // Bueno
        2: '#FFFF00', // Moderado
        3: '#FF7E00', // Insalubre
        4: '#FF0000', // Muy Insalubre
        5: '#99004c', // Malo
        6: '#800000', // Severo
    };

    // Función para actualizar la opacidad de los puntos del cluster seleccionado y agregar borde
    function updateClusterDisplay(clusterCount, selectedCluster, clusterColors) {
        svg.selectAll("circle")
            .attr("fill", d => clusterColors[d[`Kmeans_${clusterCount}`]]) // Relleno con el color del cluster
            .attr("opacity", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? 1 : 0.2) // Opacidad según selección
            .attr("stroke", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? "black" : "none") // Borde negro solo en el cluster seleccionado
            .attr("stroke-width", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? 1 : 0); // El borde negro tendrá grosor de 2 si está seleccionado, sino sin borde
    }

    function updateAQIDisplay() {
        // Obtener las fechas seleccionadas en los filtros activos
        const activeFilterDates = new Set(activeFilterData.map(d => `${d.year}-${d.month}-${d.day}`));
    
        svg.selectAll("circle")
            .attr("fill", d => aqiColors[d.AQI] === undefined ? '#000000' : aqiColors[d.AQI]) // Color por AQI
            .attr("opacity", d => activeFilterDates.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0.1); // Opacar los no seleccionados
    }

    document.getElementById("cluster-3-btn").addEventListener("click", function () {
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.

        document.getElementById("cluster-3-btn").classList.remove("dimmed");
        document.getElementById("cluster-3-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");   
        document.getElementById("cluster-6-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

    
        svg.selectAll("circle")
            .attr("fill", d => kmeans3Colors[d.Kmeans_3])
            .attr("opacity", 1);

        document.getElementById("cluster-3-select").disabled = false;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-3-select").value = "";
    });

    document.getElementById("cluster-12-btn").addEventListener("click", function () {
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.
        document.getElementById("cluster-12-btn").classList.remove("dimmed");
        document.getElementById("cluster-12-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");   
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-6-select").classList.add("dimmed");
        
    
        svg.selectAll("circle")
            .attr("fill", d => kmeans12Colors[d.Kmeans_12])
            .attr("opacity", 1);

        document.getElementById("cluster-12-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").value = "";
    });

    document.getElementById("cluster-4-btn").addEventListener("click", function () {
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.


        document.getElementById("cluster-4-btn").classList.remove("dimmed");
        document.getElementById("cluster-4-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-6-select").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])
            .attr("opacity", 1);

        document.getElementById("cluster-4-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-4-select").value = "";
    });


    // Evento para el botón de cluster-6
    document.getElementById("cluster-6-btn").addEventListener("click", function () {
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.

        document.getElementById("cluster-6-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");


        svg.selectAll("circle")
            .attr("fill", d => kmeans6Colors[d.Kmeans_6])
            .attr("opacity", 1);

        document.getElementById("cluster-6-select").disabled = false;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-6-select").value = "";
    });
    let filteredClusterData = data;
    let activeFilterData = data;  // Solo un filtro activo a la vez (estación, año o mes)
    
    // Evento para el selector de cluster-12
    document.getElementById("cluster-12-select").addEventListener("change", function () {
        if (isGraphLocked || isGraphLocked3) return;
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_12 === selectedCluster);
        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];
        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans12Colors[selectedCluster];
        updateVisualization();
        updateClusterDisplay(12, selectedCluster, kmeans12Colors);
        plotUMAPfusionCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });  
    // Evento para el selector de cluster-3
    document.getElementById("cluster-3-select").addEventListener("change", function () {
        if (isGraphLocked || isGraphLocked3) return;
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_3 === selectedCluster);
        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];
        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans3Colors[selectedCluster];
        updateVisualization();
        updateClusterDisplay(3, selectedCluster, kmeans3Colors);
        plotUMAPfusionCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });
    // Evento para el selector de cluster-4
    document.getElementById("cluster-4-select").addEventListener("change", function () {
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.

    
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_4 === selectedCluster);

        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];

        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans4Colors[selectedCluster];

        // // Imprimir en consola las fechas y el color del cluster seleccionado
        // console.log("Fechas del Cluster seleccionado:", clusterDates);
        // console.log("Color del Cluster seleccionado:", clusterColor);

        updateVisualization();
        updateClusterDisplay(4, selectedCluster, kmeans4Colors);
        plotUMAPfusionCluster(filterDataFusion, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });

    
    let filteredClusterData2 = data;
    let activeFilterData2 = data;  // Solo un filtro activo a la vez (estación, año o mes)

    // Evento para el selector de cluster-6
    document.getElementById("cluster-6-select").addEventListener("change", function () {
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData2 = data.filter(d => d.Kmeans_6 === selectedCluster);
        
        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData2.map(d => `${d.year}-${d.month}-${d.day}`))];

        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans6Colors[selectedCluster];

        // // Imprimir en consola las fechas y el color del cluster seleccionado
        // console.log("Fechas del Cluster seleccionado:", clusterDates);
        // console.log("Color del Cluster seleccionado:", clusterColor);

        updateVisualization2();
        updateClusterDisplay(6, selectedCluster, kmeans6Colors);
        plotUMAPfusionCluster(filterDataFusion, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });

    // Evento para el botón AQI
    document.getElementById("aqi-btn").addEventListener("click", function () {
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked3) return; // Si la gráfica está bloqueada, salir de la función.


        document.getElementById("aqi-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-6-select").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        updateAQIDisplay(); // Actualiza la visualización de AQI
        updateButtonOpacity("aqi-btn");

    });

    
    // Función para actualizar la opacidad de los filtros
    function updateFilterOpacity(activeFilterId) {
        const filters = ["station-filter", "year-filter", "month-filter", "aqi-filter"];
        filters.forEach((filterId) => {
            const filterElement = document.getElementById(filterId);
            if (filterId === activeFilterId) {
                filterElement.classList.remove("dimmed");
            } else {
                filterElement.classList.add("dimmed");
            }
        });
    }
    // Función para determinar qué cluster está activo
    function getActiveClusterVisualizationFunction() {
        if (!document.getElementById("cluster-6-select").disabled) {
            return updateVisualization2; // Si cluster-6 está habilitado, usa updateVisualization2
        }
        if (!document.getElementById("cluster-4-select").disabled) {
            return updateVisualization; // Si cluster-4 está habilitado, usa updateVisualization
        }
        if (!document.getElementById("cluster-3-select").disabled) {
            return updateVisualization3; // Si cluster-3 está habilitado, usa updateVisualization3
        }
        if (!document.getElementById("cluster-12-select").disabled) {
            return updateVisualization4; // Si cluster-12 está habilitado, usa updateVisualization12
        }
    }
     
    // Evento para el filtro de estación del año
    document.getElementById('station-filter').addEventListener('change', (event) => {
        if (isGraphLocked || isGraphLocked3) return;

        const selectedSeason = event.target.value;
        activeFilterData = filterDataBySeason(selectedSeason, data); // Actualiza el único filtro activo
        activeFilterData2 = filterDataBySeason(selectedSeason, data); // Actualiza el único filtro activo

        highlightSeason(selectedSeason, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('station-filter');
    });

    // Evento para el filtro de año
    document.getElementById('year-filter').addEventListener('change', (event) => {
        if (isGraphLocked || isGraphLocked3) return;

        const selectedYear = parseInt(event.target.value, 10);
        activeFilterData = data.filter(d => d.year === selectedYear); // Solo un filtro activo a la vez
        activeFilterData2 = data.filter(d => d.year === selectedYear); // Solo un filtro activo a la vez

        highlightYear(selectedYear, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('year-filter');
    });

    // Evento para el filtro de mes
    document.getElementById('month-filter').addEventListener('change', (event) => {
        if (isGraphLocked || isGraphLocked3) return;

        const selectedMonth = event.target.value;
        activeFilterData = filterDataByMonth(selectedMonth, data); // Solo un filtro activo a la vez
        activeFilterData2 = filterDataByMonth(selectedMonth, data); // Solo un filtro activo a la vez

        highlightMonth(selectedMonth, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('month-filter');
    });

    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    function updateVisualization() {
        const clusterDates = new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates = new Set(activeFilterData.map(d => `${d.year}-${d.month}-${d.day}`));

        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates.has(date)));

        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData.filter(d => activeFilterDates.has(`${d.year}-${d.month}-${d.day}`));

        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) || 
                                activeFilterDates.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);

        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;

            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    function updateVisualization2() {
        const clusterDates = new Set(filteredClusterData2.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates2 = new Set(activeFilterData2.map(d => `${d.year}-${d.month}-${d.day}`));

        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates2.has(date)));

        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData2.filter(d => activeFilterDates2.has(`${d.year}-${d.month}-${d.day}`));

        svg.selectAll("circle")
            .attr("fill", d => kmeans6Colors[d.Kmeans_6])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) || 
                                activeFilterDates2.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);

        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;

            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    
    function updateVisualization3() {
        const clusterDates = new Set(filteredClusterData3.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates3 = new Set(activeFilterData3.map(d => `${d.year}-${d.month}-${d.day}`));
        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates3.has(date)));
        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData3.filter(d => activeFilterDates3.has(`${d.year}-${d.month}-${d.day}`));
        svg.selectAll("circle")
            .attr("fill", d => kmeans3Colors[d.Kmeans_3])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) ||
                                activeFilterDates3.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);
        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null; 
            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    function updateVisualization4() {
        const clusterDates = new Set(filteredClusterData4.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates4 = new Set(activeFilterData4.map(d => `${d.year}-${d.month}-${d.day}`));
        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates4.has(date)));
        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData4.filter(d => activeFilterDates4.has(`${d.year}-${d.month}-${d.day}`));
        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) ||
                                activeFilterDates4.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);
        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;
            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }   
    // Función para manejar la actualización de gráficos
    function handleSelectionUpdate(filteredData, selectedDates, fechaInicio, fechaFin) {
        if (selectedDates.length === 0) {
            console.warn("No hay fechas válidas seleccionadas.");
            return;
        }

        // console.log("Actualizando gráficos con fechas seleccionadas:", selectedDates);
        const cityFile = filteredData.length > 0 ? filteredData[0].city : null;

        updateTimeSeriesChart(cityFile, fechaInicio, fechaFin, selectedDates);
        updateCorrelationMatrixnew(selectedDates);
        drawThemeRiver(cityFile, selectedDates);
        updateRadialChartWithSelection(filteredData, fechaInicio, fechaFin);
    }
    // Función para filtrar datos por estación
    function filterDataBySeason(season, data) {
        const seasonRanges = {
            Primavera: { start: { month: 3, day: 20 }, end: { month: 6, day: 21 } },
            Verano: { start: { month: 6, day: 21 }, end: { month: 9, day: 22 } },
            Otoño: { start: { month: 9, day: 22 }, end: { month: 12, day: 21 } },
            Invierno: { start: { month: 12, day: 21 }, end: { month: 3, day: 20 } }
        };

        const range = seasonRanges[season];
        if (!range) return [];

        return data.filter(d => {
            const start = new Date(d.year, range.start.month - 1, range.start.day);
            const end = new Date(d.year, range.end.month - 1, range.end.day);
            const date = new Date(d.year, d.month - 1, d.day);

            return season === 'Invierno'
                ? (date >= start || date <= end)
                : (date >= start && date <= end);
        });
    }

    // Función para filtrar datos por mes
    function filterDataByMonth(month, data) {
        const monthMapping = {
            Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
            Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
        };
        const monthNumber = monthMapping[month];
        return data.filter(d => d.month === monthNumber);
    }

    // Dimensiones del contenedor
    const container = d3.select("#umap-plot-contaminacion");
    const width = container.node().clientWidth || 800; // Default width
    const height = container.node().clientHeight || 440; // Default height
        
    const svg = container.append("svg")
        .attr("transform", "translate(275, -190)") // Desplazamiento hacia la derecha y abajo
        .attr("width", "45%")
        .attr("height", "45%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "none") // Fondo transparente
        .style("position", "relative") // Asegura que el desplazamiento funcione correctamente
        .style("border", "1px solid black") // Agrega un borde negro de 2px
        .style("border-radius", "10px") // Bordes redondeados
        .on("contextmenu", (event) => event.preventDefault());
    // Agregar título en la parte superior izquierda
    svg.append("text")
        .attr("x", 53) // Posición horizontal (izquierda)
        .attr("y", 30) // Posición vertical (arriba)
        .attr("font-size", "30px") // Tamaño de la fuente
        .attr("font-weight", "bold") // Negrita
        .attr("fill", "black") // Color del texto
        .text("Contaminantes");

    // Agregar un checkbox al lado del título
    const checkbox = d3.select("#umap-plot-contaminacion")
        .append("input")
        .attr("type", "checkbox")
        .attr("id", "toggle-umap-contaminacion")
        .style("position", "absolute")
        .style("left", "295px") // Ajusta la posición respecto al contenedor
        .style("top", "16px") // Ajusta la posición respecto al contenedor
        .property("checked", false); // Inicia desmarcado

    // Función para resaltar el borde cuando el checkbox esté marcado
    d3.select("#toggle-umap-contaminacion").on("change", function () {
        const isChecked = d3.select(this).property("checked");

    // Cambiar el borde del SVG dependiendo del estado del checkbox
    if (isChecked) {
        svg.style("border", "1px solid #ff6347"); // Borde resaltado con color cuando está seleccionado
        enableClusterAndAQIControls2(); // Habilitar botones de clusters y AQI
        isGraphLocked2 = true; // Bloquear gráfica
        isGraphLocked_boton2 = false; // Desbloquear botones
        d3.selectAll(".legend-item-pca2, .reset-button-pca2")
        .style("pointer-events", "all")
        .style("opacity", "1") // Habilitar botones
        .style("display", "block"); // Mostrar botones de nuevo


    } else {
        svg.style("border", "1px solid black"); // Borde normal cuando no está seleccionado
        disableClusterAndAQIControls2(); // Deshabilitar botones de clusters y AQI
        isGraphLocked2 = false; // Desbloquear gráfica
        isGraphLocked_boton2 = true;
        d3.selectAll(".legend-item-pca2, .reset-button-pca2")
        .style("pointer-events", "none")
        .style("opacity", "0.5")

    }
    });

    // Función para habilitar los controles de clusters y AQI
    function enableClusterAndAQIControls2() {
        document.getElementById("cluster-4-btn").disabled = false;
        document.getElementById("cluster-6-btn").disabled = false;
        document.getElementById("cluster-3-btn").disabled = false;
        document.getElementById("cluster-12-btn").disabled = false;
        document.getElementById("aqi-btn").disabled = false;
        document.getElementById("cluster-4-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = false;
        document.getElementById("cluster-3-select").disabled = false;
        document.getElementById("cluster-12-select").disabled = false;
        document.getElementById("aqi-btn").classList.remove("dimmed");
        document.getElementById("cluster-4-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-btn").classList.remove("dimmed");
        document.getElementById("cluster-3-btn").classList.remove("dimmed");
        document.getElementById("cluster-12-btn").classList.remove("dimmed");
        }
    
        // Función para deshabilitar los controles de clusters y AQI
        function disableClusterAndAQIControls2() {
        document.getElementById("cluster-4-btn").disabled = true;
        document.getElementById("cluster-6-btn").disabled = true;
        document.getElementById("cluster-3-btn").disabled = true;
        document.getElementById("cluster-12-btn").disabled = true;
        document.getElementById("aqi-btn").disabled = true;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        }

    // Inicializar en el estado deshabilitado
    disableClusterAndAQIControls2();

    // Grupo para aplicar zoom
    const g = svg.append("g");

    // Escalas
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP1))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP2))
        .range([height, 0]);

    // Colores según el nivel de AQI
    const colorScale = d3.scaleOrdinal()
        .domain([1, 2, 3, 4, 5, 6])
        .range(['#00E400', '#FFFF00', '#FF7E00', '#FF0000', '#99004c', '#800000']);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    // Dibujar puntos
    g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.UMAP1))
        .attr("cy", d => yScale(d.UMAP2))
        .attr("r", 6)
        .attr("fill", d => colorScale(d.AQI))
        .attr("opacity", 1)
        .attr("stroke", "none")  // Sin borde inicialmente
            // Agregar manejador para el filtro de estación

        .on("mouseover", function (event, d) {
        tooltip.style("visibility", "visible")
            .html(`
                <strong>Ciudad:</strong> ${d.city.replace('Data_', '').replace('.csv', '')}<br>
                <strong>Fecha:</strong> ${d.day}/${d.month}/${d.year}<br>
                <strong>AQI:</strong> ${d.AQI}
            `);

        d3.select(this)
            .attr("r", 10)
            .attr("stroke-width", 1);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.style("visibility", "hidden");

            d3.select(this)
                .attr("r", 6)
                .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0); 
        });
        
        function highlightSeason(season, data, svg, xScale, yScale) {
            // Definir rangos de fechas para cada estación
            const seasonRanges = {
                Primavera: { start: { month: 3, day: 20 }, end: { month: 6, day: 21 } },
                Verano: { start: { month: 6, day: 21 }, end: { month: 9, day: 22 } },
                Otoño: { start: { month: 9, day: 22 }, end: { month: 12, day: 21 } },
                Invierno: { start: { month: 12, day: 21 }, end: { month: 3, day: 20 } },
            };
        
            const range = seasonRanges[season];
            if (!range) return;
        
            function isInSeason(d) {
                const start = new Date(d.year, range.start.month - 1, range.start.day);
                const end = new Date(d.year, range.end.month - 1, range.end.day);
                const date = new Date(d.year, d.month - 1, d.day);
        
                if (season === 'Invierno') {
                    return (
                        (date >= start && d.month >= 12) || 
                        (d.month <= 3 && date <= end)
                    );
                }
        
                return date >= start && date <= end;
            }
        
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => isInSeason(d))
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("r", 8);
        }
        
        function highlightYear(year, data, svg, xScale, yScale) {
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => d.year === year)
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("r", 8);
        }
        
        function highlightMonth(month, data, svg, xScale, yScale) {
            const months = {
                Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
                Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
            };
        
            const monthNumber = months[month];
            if (!monthNumber) return;
        
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => d.month === monthNumber)
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("r", 8);
        }
    // Variables para la selección
    let isDrawing = false;
    let points = [];
    let selectionLine; // Para almacenar la línea de selección

    // Zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);
    const initialTransform = d3.zoomIdentity.translate(width / 9.5, height / 9).scale(0.79);
    svg.call(zoom).call(zoom.transform, initialTransform);

    svg.on("mousedown", (event) => {
        if (event.button !== 2) return; // Solo activar con anticlick (botón derecho del mouse)

        // Limpiar la selección anterior
        if (selectionLine) {
            selectionLine.remove();
        }

        isDrawing = true;
        points = []; // Reiniciar puntos

        const [startX, startY] = d3.pointer(event, g.node());
        points.push([startX, startY]);

        // Crear línea inicial
        selectionLine = g.append("polyline")
            .attr("fill", "rgba(100, 100, 255, 0.3)")
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("points", points.join(" "));

        svg.on("mousemove", (event) => {
            if (!isDrawing) return;

            const [currentX, currentY] = d3.pointer(event, g.node());
            points.push([currentX, currentY]);
            selectionLine.attr("points", points.join(" "));
        });
    });

    svg.on("mouseup", () => {
        if (!isDrawing) return;

        isDrawing = false;

        // Unir el último punto con el primero
        points.push(points[0]); // Añadir el primer punto al final para cerrar el polígono
        selectionLine.attr("points", points.join(" ")); // Actualizar la línea para incluir el cierre

        // Filtrar los puntos seleccionados dentro del polígono
        const selectionData = data.filter(d => {
            const x = xScale(d.UMAP1);
            const y = yScale(d.UMAP2);
            return d3.polygonContains(points, [x, y]); // Verificar si el punto está dentro del polígono
        });

        // Verificar si hay datos seleccionados
        if (selectionData.length === 0) {
            console.warn("No se seleccionaron puntos dentro del área.");
            return;
        }

        // Construir el arreglo de fechas seleccionadas
        const selectedDates = selectionData.map(d => `${d.year}-${d.month}-${d.day}`);

        // Verifica que haya fechas válidas en `selectedDates`
        if (selectedDates.length === 0) {
            console.warn("No hay fechas válidas en los datos seleccionados.");
            return;
        }

        // Obtener el archivo de la ciudad seleccionada
        const cityFile = selectionData[0].city;

        // Llamar a las funciones con las fechas seleccionadas
        updateTimeSeriesChart(cityFile, fechaInicio, fechaFin, selectedDates);
        updateCorrelationMatrixnew(selectedDates);
        drawThemeRiver(cityFile, selectedDates);
        updateRadialChartWithSelection(selectionData, fechaInicio, fechaFin);
        plotUMAPfusionCluster(filterDataFusion, fechaInicio, fechaFin, selectedDates, "aqi");
        plotUMAPmetCluster(filterDataMet, fechaInicio, fechaFin, selectedDates, "aqi");
        // Restaurar todos los puntos a su estado original antes de aplicar cambios a los puntos seleccionados
        svg.selectAll("circle")
            .attr("r", 6)  // Restaurar el radio original de los puntos (ajusta según el tamaño original)
            .attr("stroke", "none");  // Eliminar el borde azul

        // Hacer los puntos seleccionados más grandes y agregar un borde azul
        selectionData.forEach(d => {
            const x = xScale(d.UMAP1);
            const y = yScale(d.UMAP2);
            // Buscar el círculo correspondiente y cambiar su radio y agregar un borde
            svg.selectAll("circle")
                .filter(function() {
                    const cx = parseFloat(this.getAttribute("cx"));
                    const cy = parseFloat(this.getAttribute("cy"));
                    return cx === x && cy === y;
                })
                .attr("r", 8)  // Cambiar el tamaño del radio
                .attr("stroke", "blue")  // Agregar borde azul
                .attr("stroke-width", 3);  // Establecer el grosor del borde
        });
    });

    // Agregar la leyenda como botones
    const legendData = [
        { color: '#00E400', label: 'Bueno', AQI: 1 },
        { color: '#FFFF00', label: 'Moderado', AQI: 2 },
        { color: '#FF7E00', label: 'Insalubre', AQI: 3 },
        { color: '#FF0000', label: 'Muy Insalubre', AQI: 4 },
        { color: '#99004c', label: 'Malo', AQI: 5 },
        { color: '#800000', label: 'Severo', AQI: 6 },
    ];

    // Crear la leyenda como botones, asegurando que esté delante de otros elementos
    if (container.select('.legend-pca').empty()) {
        const legend = container.insert('div', ':first-child')
            .attr('class', 'legend-pca')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('align-items', 'center')
            .style('position', 'absolute')
            .style('bottom', '-1%') // Coloca la leyenda en la parte inferior del contenedor
            .style('left', '4%')
            .style('width', '90%') // Ajusta el ancho disponible
            .style('height', 'auto')
            .style('font-family', 'Arial, sans-serif')
            .style('font-weight', 'bold')
            .style('z-index', '1000') // Asegura que esté encima de cualquier cosa
            .style('pointer-events', 'all') // Permite interacciones con los botones
            .style('border-radius', '10px')
            .style('padding', '10px') // Espaciado interno para los botones
            .style('text-align', 'center');  // Centrar el texto

        legendData.forEach((item, index) => {
            const legendButton = legend.append('button')
                .attr('class', 'legend-item-pca2')
                .style('background-color', item.color)
                .style('padding', '3px 10px')
                .style('margin', '0 4px')
                .style('border-radius', '5px')
                .style('color', index > 3 ? 'white' : 'black') // Texto blanco para "Malo" y "Severo"
                .style('border', 'none')
                .style('cursor', 'pointer')
                .style('font-weight', 'bold')
                .style('text-align', 'center')  // Centrar el texto
                .style('font-size', '11px')
                .style('box-shadow', '0px 2px 5px rgba(0, 0, 0, 0.3)') // Sombra para resaltar los botones
                .text(item.label);

            // Cambiar la opacidad y agregar borde en hover
            legendButton
                .on('mouseover', () => {
                    legendButton.style('box-shadow', '0px 0px 5px 2px rgba(0,0,0,0.5)');
                })
                .on('mouseout', () => {
                    if (!legendButton.classed('selected')) {
                        legendButton.style('box-shadow', 'none');
                    }
                });

            // Filtrar puntos al hacer clic
            legendButton.on('click', () => {
                // Quitar la sombra de todos los botones y restablecer tamaño
                if (isGraphLocked_boton2) return;
                legend.selectAll('button')
                    .style('box-shadow', 'none')
                    .style('transform', 'scale(1)')
                    .style('opacity', '0.7')  // Reducir opacidad de los otros botones
                    .classed('selected', false);
                
                // Agregar la clase 'selected' al botón clickeado para aplicar la sombra
                legendButton.style('box-shadow', '0px 0px 5px 2px rgba(0,0,0,0.5)')
                    .style('transform', 'scale(1.1)') // Hacer que el botón crezca un poco
                    .style('opacity', '1')  // El botón seleccionado no pierde opacidad
                    .classed('selected', true);

                const selectedAQI = index + 1; // AQI corresponde al índice + 1

                // Filtrar puntos en el gráfico UMAP
                svg.selectAll('circle')
                    .attr('opacity', d => (d.AQI === selectedAQI ? 1 : 0.1));

                // Filtrar datos para otras visualizaciones
                const selectedData = data.filter(d => d.AQI === selectedAQI);
                const selectedDates = selectedData.map(d => `${d.year}-${d.month}-${d.day}`);

                // Actualizar otras gráficas con los datos seleccionados
                updateTimeSeriesChart(selectedData[0]?.city, fechaInicio, fechaFin, selectedDates);
                updateCorrelationMatrixnew(selectedDates);
                drawThemeRiver(selectedData[0]?.city, selectedDates);
                updateRadialChartWithSelection(selectedData, fechaInicio, fechaFin);
            });
        });

        // Agregar un botón para resetear el filtro
        legend.append('button')
            .attr('class', 'reset-button-pca2')
            .style('background-color', '#ccc')
            .style('padding', '5px 15px')
            .style('margin', '0 5px')
            .style('border-radius', '5px')
            .style('color', 'black')
            .style('border', 'none')
            .style('cursor', 'pointer')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('box-shadow', '0px 2px 5px rgba(0, 0, 0, 0.3)') // Sombra para resaltar el botón
            .text('Resetear')
            .on('mouseover', function () {
                d3.select(this).style('box-shadow', '0px 0px 5px 2px rgba(0,0,0,0.5)');
            })
            .on('mouseout', function () {
                d3.select(this).style('box-shadow', 'none');
            })
            .on('click', () => {
                // Resetear opacidad de todos los puntos
                svg.selectAll('circle')
                    .attr('opacity', 1);

                // Eliminar la sombra de todos los botones y quitar la clase 'selected'
                legend.selectAll('button')
                    .style('box-shadow', 'none')
                    .style('transform', 'scale(1)')
                    .style('opacity', '1')  // Restaurar opacidad original
                    .classed('selected', false);
            });
    }

}

function plotUMAPmet(data, fechaInicio, fechaFin) {
    // Limpiar el gráfico anterior
    d3.select("#umap-plot-meteorologia").selectAll("*").remove();
    // console.log("Fechas de entrada:", fechaInicio, fechaFin);
    // Colores para Kmeans_4
    // Colores para Kmeans_3
    const kmeans3Colors = {
        0: '#1b9e77',
        1: '#d95f02',
        2: '#7570b3',
    };

    // Colores para Kmeans_4
    const kmeans4Colors = {
        0: '#66c2a5',
        1: '#fc8d62',
        2: '#8da0cb',
        3: '#e78ac3',
    };

    // Colores para Kmeans_6
    const kmeans6Colors = {
        0: '#fdae61',
        1: '#fee08b',
        2: '#d73027',
        3: '#4575b4',
        4: '#313695',
        5: '#91bfdb',
    };

    // Colores para Kmeans_12
    const kmeans12Colors = {
        0: '#a6cee3',
        1: '#1f78b4',
        2: '#b2df8a',
        3: '#33a02c',
        4: '#fb9a99',
        5: '#e31a1c',
        6: '#fdbf6f',
        7: '#ff7f00',
        8: '#cab2d6',
        9: '#6a3d9a',
        10: '#ffff99',
        11: '#b15928',
    };

    // Colores para AQI
    const aqiColors = {
        1: '#D3D3D3', // Bueno
        2: '#D3D3D3', // Moderado
        3: '#D3D3D3', // Insalubre
        4: '#D3D3D3', // Muy Insalubre
        5: '#D3D3D3', // Malo
        6: '#D3D3D3', // Severo
    };


    // Función para actualizar la opacidad de los puntos del cluster seleccionado y agregar borde
    function updateClusterDisplay(clusterCount, selectedCluster, clusterColors) {
        svg.selectAll("circle")
            .attr("fill", d => clusterColors[d[`Kmeans_${clusterCount}`]]) // Relleno con el color del cluster
            .attr("opacity", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? 1 : 0.2) // Opacidad según selección
            .attr("stroke", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? "black" : "none") // Borde negro solo en el cluster seleccionado
            .attr("stroke-width", d => d[`Kmeans_${clusterCount}`] === selectedCluster ? 1 : 0); // El borde negro tendrá grosor de 2 si está seleccionado, sino sin borde
    }

    function updateAQIDisplay() {
        // Obtener las fechas seleccionadas en los filtros activos
        const activeFilterDates = new Set(activeFilterData.map(d => `${d.year}-${d.month}-${d.day}`));
    
        svg.selectAll("circle")
            .attr("fill", d => aqiColors[d.AQI] === undefined ? '#000000' : aqiColors[d.AQI]) // Color por AQI
            .attr("opacity", d => activeFilterDates.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0.1); // Opacar los no seleccionados
    }
    


    // Evento para el selector de cluster-3
    document.getElementById("cluster-3-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        document.getElementById("cluster-3-btn").classList.remove("dimmed");
        document.getElementById("cluster-3-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");   
        document.getElementById("cluster-6-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        svg.selectAll("circle")
            .attr("fill", d => kmeans3Colors[d.Kmeans_3])
            .attr("opacity", 1);

        document.getElementById("cluster-3-select").disabled = false;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-3-select").value = "";
    });

    // Evento para el selector de cluster-12
    document.getElementById("cluster-12-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        document.getElementById("cluster-12-btn").classList.remove("dimmed");
        document.getElementById("cluster-12-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");   
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-6-select").classList.add("dimmed");
        

        svg.selectAll("circle")
            .attr("fill", d => kmeans12Colors[d.Kmeans_12])
            .attr("opacity", 1);

        document.getElementById("cluster-12-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").value = "";
    });


    // Evento para el botón de cluster-4
    document.getElementById("cluster-4-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        document.getElementById("cluster-4-btn").classList.remove("dimmed");
        document.getElementById("cluster-4-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-6-select").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])
            .attr("opacity", 1);

        document.getElementById("cluster-4-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-4-select").value = "";
    });

    // Evento para el botón de cluster-6
    document.getElementById("cluster-6-btn").addEventListener("click", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        document.getElementById("cluster-6-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-select").classList.remove("dimmed");
        document.getElementById("aqi-btn").classList.add("dimmed");

        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-4-select").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-3-select").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
        document.getElementById("cluster-12-select").classList.add("dimmed");

        svg.selectAll("circle")
            .attr("fill", d => kmeans6Colors[d.Kmeans_6])
            .attr("opacity", 1);

        document.getElementById("cluster-6-select").disabled = false;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("cluster-6-select").value = "";
    });
    let filteredClusterData = data;
    let activeFilterData = data;  // Solo un filtro activo a la vez (estación, año o mes)
    
    // Evento para el selector de cluster-12
    document.getElementById("cluster-12-select").addEventListener("change", function () {
        if (isGraphLocked2 || isGraphLocked) return;
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_12 === selectedCluster);
        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];
        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans12Colors[selectedCluster];
        updateVisualization();
        updateClusterDisplay(12, selectedCluster, kmeans12Colors);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPfusionCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });

    // Evento para el selector de cluster-3
    document.getElementById("cluster-3-select").addEventListener("change", function () {
        if (isGraphLocked2 || isGraphLocked) return;
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_3 === selectedCluster);
        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];
        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans3Colors[selectedCluster];
        updateVisualization();
        updateClusterDisplay(3, selectedCluster, kmeans3Colors);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPfusionCluster(filterDataMet, fechaInicio, fechaFin, clusterDates, clusterColor);
    });

    // Evento para el selector de cluster-4
    document.getElementById("cluster-4-select").addEventListener("change", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData = data.filter(d => d.Kmeans_4 === selectedCluster);
            // Obtener las fechas únicas del cluster seleccionado
            const clusterDates = [...new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`))];

            // Obtener el color correspondiente al cluster seleccionado
            const clusterColor = kmeans4Colors[selectedCluster];
    
            // // Imprimir en consola las fechas y el color del cluster seleccionado
            // console.log("Fechas del Cluster seleccionado:", clusterDates);
            // console.log("Color del Cluster seleccionado:", clusterColor);
    
        updateVisualization();
        updateClusterDisplay(4, selectedCluster, kmeans4Colors);
        plotUMAPfusionCluster(filterDataFusion, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
    });
    
    let filteredClusterData2 = data;
    let activeFilterData2 = data;  // Solo un filtro activo a la vez (estación, año o mes)

    // Evento para el selector de cluster-6
    document.getElementById("cluster-6-select").addEventListener("change", function () {
        if (isGraphLocked2) return; // Si la gráfica está bloqueada, salir de la función.
        if (isGraphLocked) return; // Si la gráfica está bloqueada, salir de la función.
        const selectedCluster = parseInt(this.value.replace('Cluster ', '')) - 1;
        filteredClusterData2 = data.filter(d => d.Kmeans_6 === selectedCluster);

        // Obtener las fechas únicas del cluster seleccionado
        const clusterDates = [...new Set(filteredClusterData2.map(d => `${d.year}-${d.month}-${d.day}`))];

        // Obtener el color correspondiente al cluster seleccionado
        const clusterColor = kmeans6Colors[selectedCluster];

        // // Imprimir en consola las fechas y el color del cluster seleccionado
        // console.log("Fechas del Cluster seleccionado:", clusterDates);
        // console.log("Color del Cluster seleccionado:", clusterColor);
        updateVisualization2();
        updateClusterDisplay(6, selectedCluster, kmeans6Colors);
        plotUMAPfusionCluster(filterDataFusion, fechaInicio, fechaFin, clusterDates, clusterColor);
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, clusterDates, clusterColor);
    });

    document.getElementById("aqi-btn").disabled = true;


    
    // Función para actualizar la opacidad de los filtros
    function updateFilterOpacity(activeFilterId) {
        const filters = ["station-filter", "year-filter", "month-filter", "aqi-filter"];
        filters.forEach((filterId) => {
            const filterElement = document.getElementById(filterId);
            if (filterId === activeFilterId) {
                filterElement.classList.remove("dimmed");
            } else {
                filterElement.classList.add("dimmed");
            }
        });
    }
    // Función para determinar qué cluster está activo
    function getActiveClusterVisualizationFunction() {
        if (!document.getElementById("cluster-6-select").disabled) {
            return updateVisualization2; // Si cluster-6 está habilitado, usa updateVisualization2
        }
        if (!document.getElementById("cluster-4-select").disabled) {
            return updateVisualization; // Si cluster-4 está habilitado, usa updateVisualization
        }
        if (!document.getElementById("cluster-3-select").disabled) {
            return updateVisualization3; // Si cluster-3 está habilitado, usa updateVisualization3
        }
        if (!document.getElementById("cluster-12-select").disabled) {
            return updateVisualization4; // Si cluster-12 está habilitado, usa updateVisualization12
        }
    }
    
    // Evento para el filtro de estación del año
    document.getElementById('station-filter').addEventListener('change', (event) => {
        if (isGraphLocked2 || isGraphLocked) return;

        const selectedSeason = event.target.value;
        activeFilterData = filterDataBySeason(selectedSeason, data); // Actualiza el único filtro activo
        activeFilterData2 = filterDataBySeason(selectedSeason, data); // Actualiza el único filtro activo

        highlightSeason(selectedSeason, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('station-filter');
    });

    // Evento para el filtro de año
    document.getElementById('year-filter').addEventListener('change', (event) => {
        if (isGraphLocked2 || isGraphLocked) return;

        const selectedYear = parseInt(event.target.value, 10);
        activeFilterData = data.filter(d => d.year === selectedYear); // Solo un filtro activo a la vez
        activeFilterData2 = data.filter(d => d.year === selectedYear); // Solo un filtro activo a la vez

        highlightYear(selectedYear, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('year-filter');
    });

    // Evento para el filtro de mes
    document.getElementById('month-filter').addEventListener('change', (event) => {
        if (isGraphLocked2 || isGraphLocked) return;

        const selectedMonth = event.target.value;
        activeFilterData = filterDataByMonth(selectedMonth, data); // Solo un filtro activo a la vez
        activeFilterData2 = filterDataByMonth(selectedMonth, data); // Solo un filtro activo a la vez

        highlightMonth(selectedMonth, data, svg, xScale, yScale);

        // Llama a la función de visualización correspondiente
        getActiveClusterVisualizationFunction()();
        updateFilterOpacity('month-filter');
    });

    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    function updateVisualization() {
        const clusterDates = new Set(filteredClusterData.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates = new Set(activeFilterData.map(d => `${d.year}-${d.month}-${d.day}`));

        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates.has(date)));

        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData.filter(d => activeFilterDates.has(`${d.year}-${d.month}-${d.day}`));

        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) || 
                                activeFilterDates.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);

        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;

            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    // Función para actualizar la visualización considerando solo cluster + un filtro activo
    function updateVisualization2() {
        const clusterDates = new Set(filteredClusterData2.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates2 = new Set(activeFilterData2.map(d => `${d.year}-${d.month}-${d.day}`));

        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates2.has(date)));

        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData2.filter(d => activeFilterDates2.has(`${d.year}-${d.month}-${d.day}`));

        svg.selectAll("circle")
            .attr("fill", d => kmeans6Colors[d.Kmeans_6])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) || 
                                activeFilterDates2.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);

        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;

            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    function updateVisualization3() {
        const clusterDates = new Set(filteredClusterData3.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates3 = new Set(activeFilterData3.map(d => `${d.year}-${d.month}-${d.day}`));
        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates3.has(date)));
        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData3.filter(d => activeFilterDates3.has(`${d.year}-${d.month}-${d.day}`));
        svg.selectAll("circle")
            .attr("fill", d => kmeans3Colors[d.Kmeans_3])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) ||
                                activeFilterDates3.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);
        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null; 
            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }

    function updateVisualization4() {
        const clusterDates = new Set(filteredClusterData4.map(d => `${d.year}-${d.month}-${d.day}`));
        const activeFilterDates4 = new Set(activeFilterData4.map(d => `${d.year}-${d.month}-${d.day}`));
        // Intersección de fechas entre cluster y el filtro activo
        const intersectionDates = new Set([...clusterDates].filter(date => activeFilterDates4.has(date)));
        // Filtrar los datos que cumplen con la intersección de ambos filtros
        const intersectionData = filteredClusterData4.filter(d => activeFilterDates4.has(`${d.year}-${d.month}-${d.day}`));
        svg.selectAll("circle")
            .attr("fill", d => kmeans4Colors[d.Kmeans_4])  // Mantiene el color original del cluster
            .attr("opacity", d => (clusterDates.has(`${d.year}-${d.month}-${d.day}`) ||
                                activeFilterDates4.has(`${d.year}-${d.month}-${d.day}`)) ? 1 : 0.3) // Los que no están en ningún filtro se atenúan
            .attr("stroke", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? "black" : "none") // Borde rojo si está en ambos filtros
            .attr("stroke-width", d => intersectionDates.has(`${d.year}-${d.month}-${d.day}`) ? 2 : 0);
        // **Actualizar gráficos con los datos de la intersección**
        if (intersectionData.length > 0) {
            const selectedDates = intersectionData.map(d => `${d.year}-${d.month}-${d.day}`);
            const cityFile = intersectionData.length > 0 ? intersectionData[0].city : null;
            handleSelectionUpdate(intersectionData, selectedDates, fechaInicio, fechaFin);
        }
    }   
    // Función para manejar la actualización de gráficos
    function handleSelectionUpdate(filteredData, selectedDates, fechaInicio, fechaFin) {
        if (selectedDates.length === 0) {
            console.warn("No hay fechas válidas seleccionadas.");
            return;
        }

        // console.log("Actualizando gráficos con fechas seleccionadas:", selectedDates);
        const cityFile = filteredData.length > 0 ? filteredData[0].city : null;

        updateTimeSeriesChart(cityFile, fechaInicio, fechaFin, selectedDates);
        updateCorrelationMatrixnew(selectedDates);
        drawThemeRiver(cityFile, selectedDates);
        updateRadialChartWithSelection(filteredData, fechaInicio, fechaFin);
    }


    // Función para filtrar datos por estación
    function filterDataBySeason(season, data) {
        const seasonRanges = {
            Primavera: { start: { month: 3, day: 20 }, end: { month: 6, day: 21 } },
            Verano: { start: { month: 6, day: 21 }, end: { month: 9, day: 22 } },
            Otoño: { start: { month: 9, day: 22 }, end: { month: 12, day: 21 } },
            Invierno: { start: { month: 12, day: 21 }, end: { month: 3, day: 20 } }
        };

        const range = seasonRanges[season];
        if (!range) return [];

        return data.filter(d => {
            const start = new Date(d.year, range.start.month - 1, range.start.day);
            const end = new Date(d.year, range.end.month - 1, range.end.day);
            const date = new Date(d.year, d.month - 1, d.day);

            return season === 'Invierno'
                ? (date >= start || date <= end)
                : (date >= start && date <= end);
        });
    }

    // Función para filtrar datos por mes
    function filterDataByMonth(month, data) {
        const monthMapping = {
            Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
            Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
        };
        const monthNumber = monthMapping[month];
        return data.filter(d => d.month === monthNumber);
    }

    // Dimensiones del contenedor
    const container = d3.select("#umap-plot-meteorologia");
    const width = container.node().clientWidth || 800; // Default width
    const height = container.node().clientHeight || 440; // Default height
        
    const svg = container.append("svg")
        .attr("transform", "translate(27, -185)") // Desplazamiento hacia la derecha y abajo
        .attr("width", "45%")
        .attr("height", "45%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "none") // Fondo transparente
        .style("position", "relative") // Asegura que el desplazamiento funcione correctamente
        .style("border", "1px solid black") // Agrega un borde negro de 2px
        .style("border-radius", "10px") // Bordes redondeados
        .on("contextmenu", (event) => event.preventDefault());
    // Agregar título en la parte superior izquierda
    svg.append("text")
        .attr("x", 53) // Posición horizontal (izquierda)
        .attr("y", 30) // Posición vertical (arriba)
        .attr("font-size", "30px") // Tamaño de la fuente
        .attr("font-weight", "bold") // Negrita
        .attr("fill", "black") // Color del texto
        .text("Meteorologicos");

    // Agregar un checkbox al lado del título
    const checkbox = d3.select("#umap-plot-meteorologia")
        .append("input")
        .attr("type", "checkbox")
        .attr("id", "toggle-umap-meteorologia")
        .style("position", "absolute")
        .style("left", "47px") // Ajusta la posición respecto al contenedor
        .style("top", "225px") // Ajusta la posición respecto al contenedor
        .property("checked", false); // Inicia desmarcado

    // Función para resaltar el borde cuando el checkbox esté marcado
    d3.select("#toggle-umap-meteorologia").on("change", function () {
        const isChecked = d3.select(this).property("checked");

    // Cambiar el borde del SVG dependiendo del estado del checkbox
    if (isChecked) {
        svg.style("border", "1px solid #ff6347"); // Borde resaltado con color cuando está seleccionado
        enableClusterAndAQIControls3(); // Habilitar botones de clusters y AQI
        isGraphLocked3 = true; // Bloquear gráfica
        


    } else {
        svg.style("border", "1px solid black"); // Borde normal cuando no está seleccionado
        disableClusterAndAQIControls3(); // Deshabilitar botones de clusters y AQI
        isGraphLocked3 = false; // Desbloquear gráfica

    }
    });

    // Función para habilitar los controles de clusters y AQI
    function enableClusterAndAQIControls3() {
        document.getElementById("cluster-4-btn").disabled = false;
        document.getElementById("cluster-6-btn").disabled = false;
        document.getElementById("cluster-3-btn").disabled = false;
        document.getElementById("cluster-12-btn").disabled = false;
        document.getElementById("aqi-btn").disabled = false;
        document.getElementById("cluster-4-select").disabled = false;
        document.getElementById("cluster-6-select").disabled = false;
        document.getElementById("cluster-3-select").disabled = false;
        document.getElementById("cluster-12-select").disabled = false;
        document.getElementById("aqi-btn").classList.remove("dimmed");
        document.getElementById("cluster-4-btn").classList.remove("dimmed");
        document.getElementById("cluster-6-btn").classList.remove("dimmed");
        document.getElementById("cluster-3-btn").classList.remove("dimmed");
        document.getElementById("cluster-12-btn").classList.remove("dimmed");
    }

    // Función para deshabilitar los controles de clusters y AQI
    function disableClusterAndAQIControls3() {
        document.getElementById("cluster-4-btn").disabled = true;
        document.getElementById("cluster-6-btn").disabled = true;
        document.getElementById("cluster-3-btn").disabled = true;
        document.getElementById("cluster-12-btn").disabled = true;
        document.getElementById("aqi-btn").disabled = true;
        document.getElementById("cluster-4-select").disabled = true;
        document.getElementById("cluster-6-select").disabled = true;
        document.getElementById("cluster-3-select").disabled = true;
        document.getElementById("cluster-12-select").disabled = true;
        document.getElementById("aqi-btn").classList.add("dimmed");
        document.getElementById("cluster-4-btn").classList.add("dimmed");
        document.getElementById("cluster-6-btn").classList.add("dimmed");
        document.getElementById("cluster-3-btn").classList.add("dimmed");
        document.getElementById("cluster-12-btn").classList.add("dimmed");
    }


    // Grupo para aplicar zoom
    const g = svg.append("g");

    // Escalas
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP1))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.UMAP2))
        .range([height, 0]);

    // Colores según el nivel de AQI
    const colorScale = d3.scaleOrdinal()
        .domain([1, 2, 3, 4, 5, 6])
        .range(['#D3D3D3', '#D3D3D3', '#D3D3D3', '#D3D3D3', '#D3D3D3', '#D3D3D3']);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    // Dibujar puntos
    g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.UMAP1))
        .attr("cy", d => yScale(d.UMAP2))
        .attr("r", 6)
        .attr("fill", d => colorScale(d.AQI))
        .attr("opacity", 1)
        .attr("stroke", "none")  // Sin borde inicialmente
            // Agregar manejador para el filtro de estación

        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Ciudad:</strong> ${d.city.replace('Data_', '').replace('.csv', '')}<br>
                    <strong>Fecha:</strong> ${d.day}/${d.month}/${d.year}<br>
                    <strong>AQI:</strong> ${d.AQI}
                `);

            d3.select(this)
                .attr("r", 10)
                .attr("stroke-width", 1);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.style("visibility", "hidden");

            d3.select(this)
                .attr("r", 6)
                .attr("stroke-width", d => clusterDateSet.has(`${d.year}-${d.month}-${d.day}`) ? 1 : 0); 
        });
        
        function highlightSeason(season, data, svg, xScale, yScale) {
            // Definir rangos de fechas para cada estación
            const seasonRanges = {
                Primavera: { start: { month: 3, day: 20 }, end: { month: 6, day: 21 } },
                Verano: { start: { month: 6, day: 21 }, end: { month: 9, day: 22 } },
                Otoño: { start: { month: 9, day: 22 }, end: { month: 12, day: 21 } },
                Invierno: { start: { month: 12, day: 21 }, end: { month: 3, day: 20 } },
            };
        
            const range = seasonRanges[season];
            if (!range) return;
        
            function isInSeason(d) {
                const start = new Date(d.year, range.start.month - 1, range.start.day);
                const end = new Date(d.year, range.end.month - 1, range.end.day);
                const date = new Date(d.year, d.month - 1, d.day);
        
                if (season === 'Invierno') {
                    return (
                        (date >= start && d.month >= 12) || 
                        (d.month <= 3 && date <= end)
                    );
                }
        
                return date >= start && date <= end;
            }
        
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => isInSeason(d))
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("r", 8);
        }
        
        function highlightYear(year, data, svg, xScale, yScale) {
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => d.year === year)
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("r", 8);
        }
        
        function highlightMonth(month, data, svg, xScale, yScale) {
            const months = {
                Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
                Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
            };
        
            const monthNumber = months[month];
            if (!monthNumber) return;
        
            svg.selectAll("circle")
                .attr("stroke", "none")
                .attr("r", 6);
        
            svg.selectAll("circle")
                .filter(d => d.month === monthNumber)
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("r", 8);
        }
    // Variables para la selección
    let isDrawing = false;
    let points = [];
    let selectionLine; // Para almacenar la línea de selección

    // Zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);
    const initialTransform = d3.zoomIdentity.translate(width / 9.5, height / 9).scale(0.79);
    svg.call(zoom).call(zoom.transform, initialTransform);

    svg.on("mousedown", (event) => {
        if (event.button !== 2) return; // Solo activar con anticlick (botón derecho del mouse)

        // Limpiar la selección anterior
        if (selectionLine) {
            selectionLine.remove();
        }

        isDrawing = true;
        points = []; // Reiniciar puntos

        const [startX, startY] = d3.pointer(event, g.node());
        points.push([startX, startY]);

        // Crear línea inicial
        selectionLine = g.append("polyline")
            .attr("fill", "rgba(100, 100, 255, 0.3)")
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("points", points.join(" "));

        svg.on("mousemove", (event) => {
            if (!isDrawing) return;

            const [currentX, currentY] = d3.pointer(event, g.node());
            points.push([currentX, currentY]);
            selectionLine.attr("points", points.join(" "));
        });
    });

    svg.on("mouseup", () => {
        if (!isDrawing) return;

        isDrawing = false;

        // Unir el último punto con el primero
        points.push(points[0]); // Añadir el primer punto al final para cerrar el polígono
        selectionLine.attr("points", points.join(" ")); // Actualizar la línea para incluir el cierre

        // Filtrar los puntos seleccionados dentro del polígono
        const selectionData = data.filter(d => {
            const x = xScale(d.UMAP1);
            const y = yScale(d.UMAP2);
            return d3.polygonContains(points, [x, y]); // Verificar si el punto está dentro del polígono
        });

        // Verificar si hay datos seleccionados
        if (selectionData.length === 0) {
            console.warn("No se seleccionaron puntos dentro del área.");
            return;
        }

        // Construir el arreglo de fechas seleccionadas
        const selectedDates = selectionData.map(d => `${d.year}-${d.month}-${d.day}`);

        // Verifica que haya fechas válidas en `selectedDates`
        if (selectedDates.length === 0) {
            console.warn("No hay fechas válidas en los datos seleccionados.");
            return;
        }

        // Obtener el archivo de la ciudad seleccionada
        const cityFile = selectionData[0].city;


        // Llamar a las funciones con las fechas seleccionadas
        updateTimeSeriesChart(cityFile, fechaInicio, fechaFin, selectedDates);
        updateCorrelationMatrixnew(selectedDates);
        drawThemeRiver(cityFile, selectedDates);
        updateRadialChartWithSelection(selectionData, fechaInicio, fechaFin);
        plotUMAPfusionCluster(filterDataFusion, fechaInicio, fechaFin, selectedDates, "aqi");
        plotUMAPcontCluster(filteredDataCont, fechaInicio, fechaFin, selectedDates, "aqi");
        svg.selectAll("circle")
            .attr("r", 6)  // Restaurar el radio original de los puntos (ajusta según el tamaño original)
            .attr("stroke", "none");  // Eliminar el borde azul

        // Hacer los puntos seleccionados más grandes y agregar un borde azul
        selectionData.forEach(d => {
            const x = xScale(d.UMAP1);
            const y = yScale(d.UMAP2);
            // Buscar el círculo correspondiente y cambiar su radio y agregar un borde
            svg.selectAll("circle")
                .filter(function() {
                    const cx = parseFloat(this.getAttribute("cx"));
                    const cy = parseFloat(this.getAttribute("cy"));
                    return cx === x && cy === y;
                })
                .attr("r", 8)  // Cambiar el tamaño del radio
                .attr("stroke", "blue")  // Agregar borde azul
                .attr("stroke-width", 3);  // Establecer el grosor del borde
        });
    });
 

}




function updateCorrelationMatrixnew(dates) {
    console.log("FECHAS DE LA MATRIZ NEW", dates);
    const selectedAttributes = Array.from(document.querySelectorAll('.options-chek-correlation input[type="checkbox"]:checked'))
                                    .map(cb => cb.value);

    if (selectedAttributes.length === 0) return;

    // Obtener las ciudades seleccionadas
    const selectedCities = Array.from(document.querySelectorAll('#city-checkboxes input[type="radio"]:checked'))
                                .map(cb => cb.value);

    const visualizarTodo = document.getElementById('visualizar-todo').checked;

    selectedCities.forEach(selectedCity => {
        d3.csv(`data/${selectedCity}`).then(data => {
            // Filtrar los datos por las fechas seleccionadas
            if (dates && dates.length > 0) {
                data = data.filter(d => {
                    const date = `${d.year}-${d.month}-${d.day}`;
                    return dates.includes(date); // Filtrar solo las fechas seleccionadas
                });
            }

            // Agrupar por fecha y hora
            const parsedData = d3.groups(data, d => `${d.year}-${d.month}-${d.day} ${d.hour}`)
                .map(([datetime, entries]) => {
                    const avg = {};
                    selectedAttributes.forEach(attr => {
                        const values = entries.map(d => +d[attr.replace('.', '_')]).filter(v => !isNaN(v));
                        avg[attr] = values.length > 0 ? d3.mean(values) : 0;
                    });
                    return avg;
                });

            console.log("Datos de Update Matrix NEW por hora", parsedData);
            const correlationMatrix = calculateCorrelationMatrix(parsedData, selectedAttributes);
            const matrizdistancia = calculateDistanceMatrix(correlationMatrix);
            const hierarchyData = buildHierarchy(selectedAttributes, matrizdistancia);
            
            // Crear o actualizar el dendrograma radial
            createRadialDendrogram(hierarchyData, selectedAttributes, matrizdistancia, selectedCity, dates.join(', '));
        });
    });
}


async function drawThemeRiver(cityFile, dates) {
    const lastDate = new Date(dates[dates.length - 1]);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 1);
    dates.push(nextDate.toISOString());

    const response = await fetch(`data/${cityFile}`);
    const csvData = await response.text();
    const data = d3.csvParse(csvData, d => ({
        date: new Date(+d.year, +d.month - 1, +d.day, +d.hour || 0),
        PM2_5: +d.PM2_5 || null,
        PM10: +d.PM10 || null,
        SO2: +d.SO2 || null,
        NO2: +d.NO2 || null,
        CO: +d.CO || null,
        O3: +d.O3 || null,
        TEMP: +d.TEMP || null,
        PRES: +d.PRES || null,
        DEWP: +d.DEWP || null,
        RAIN: +d.RAIN || null,
    }));

    const selectedDatesSet = new Set(dates.map(date => new Date(date).getTime()));
    const filteredData = data.filter(d => selectedDatesSet.has(d.date.getTime()));

    // if (filteredData.length === 0) {
    //     alert("No se encontraron datos para las fechas seleccionadas.");
    //     return;
    // }

    const contaminantAttributes = ["O3", "CO", "NO2", "SO2", "PM10", "PM2_5"];
    const meteorologicalAttributes = ["RAIN", "DEWP", "PRES", "TEMP"];
    const attributes = [...contaminantAttributes, ...meteorologicalAttributes];

    const attributeStats = attributes.reduce((stats, attr) => {
        const values = filteredData.map(d => d[attr]).filter(value => value !== null);
        stats[attr] = { min: Math.min(...values), max: Math.max(...values) };
        return stats;
    }, {});

    const normalizedData = filteredData.map(d => {
        const normalized = { date: d.date };
        attributes.forEach(attr => {
            const { min, max } = attributeStats[attr];
            normalized[attr] = d[attr] !== null && max > min
                ? (d[attr] - min) / (max - min)
                : 0.5;
        });
        return normalized;
    });

    const margin = { top: 100, right: 10, bottom: 70, left: 30 };
    const width = 600 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const container = d3.select("#evolution-plot");
    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const labelsGroup = svg.append("g")
        .attr("transform", `translate(50, ${height + margin.top -295})`);

    const stack = d3.stack()
        .keys(attributes)
        .value((d, key) => d[key] || 0)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetWiggle);

    const series = stack(normalizedData);

    const x = d3.scaleLinear()
        .domain([0, normalizedData.length - 1])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([
            d3.min(series.flat(), d => d[0]),
            d3.max(series.flat(), d => d[1])
        ])
        .range([height, 0]);

    const attributeColors = {
        'PM2_5': '#FF0000',
        'PM10': '#FF9900',
        'SO2': '#FFD700',
        'NO2': '#d500f1',
        'CO': '#00CED1',
        'O3': '#0000FF',
        'TEMP': '#008000',
        'PRES': '#8B0000',
        'DEWP': '#4B0082',
        'RAIN': '#1E90FF'
    };

    const area = d3.area()
        .x((d, i) => x(i))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    const updateGraph = (xDomain) => {
        x.domain([
            Math.max(0, xDomain[0]),
            Math.min(normalizedData.length - 1, xDomain[1])
        ]);

        chartGroup.selectAll("path")
            .data(series)
            .join("path")
            .attr("fill", d => attributeColors[d.key])
            .attr("d", area);

        const maxTicks = 30; // Número máximo de fechas visibles
        const totalVisibleDates = Math.round(x.domain()[1] - x.domain()[0]);
        const tickStep = Math.ceil(totalVisibleDates / maxTicks);
        const visibleDates = d3.range(
            Math.round(x.domain()[0]),
            Math.round(x.domain()[1]),
            tickStep
        );

        const dateTicks = visibleDates.map(i => ({
            index: i,
            date: normalizedData[i].date
        }));

        const gridLines = chartGroup.selectAll(".grid-line")
            .data(dateTicks, d => d.index);

        gridLines.enter()
            .append("line")
            .attr("class", "grid-line")
            .merge(gridLines)
            .attr("x1", d => x(d.index))
            .attr("x2", d => x(d.index))
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.15)
            .attr("stroke-width", 1);

        gridLines.exit().remove();

        chartGroup.select(".x-axis")
            .call(
                d3.axisBottom(x)
                    .tickValues(visibleDates)
                    .tickFormat(i => d3.timeFormat("%d-%m-%Y")(normalizedData[i].date))
            )
            .selectAll("text")
            .attr("transform", `rotate(-45)`)
            .style("text-anchor", "end");
    };

    chartGroup.append("g")
        .selectAll("path")
        .data(series)
        .join("path")
        .attr("fill", d => attributeColors[d.key])
        .attr("d", area);

    chartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(
            d3.axisBottom(x)
                .ticks(20)
                .tickFormat(i => d3.timeFormat("%d-%m-%Y")(normalizedData[Math.round(i)].date))
        )
        .selectAll("text")
        .attr("transform", `rotate(-45)`)
        .style("text-anchor", "end");

    // Eliminamos o comentamos esta línea para ocultar el eje Y
    // chartGroup.append("g")
    //     .call(d3.axisLeft(y));

    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", ({ selection }) => {
            if (!selection) return;

            const [x0, x1] = selection.map(x.invert);
            const startIndex = Math.max(0, Math.floor(x0));
            const endIndex = Math.min(normalizedData.length - 1, Math.ceil(x1));

            updateGraph([startIndex, endIndex]);
            chartGroup.select(".brush").call(brush.move, null);
        });

    chartGroup.append("g")
        .attr("class", "brush")
        .call(brush);

    svg.on("dblclick", () => {
        updateGraph([0, normalizedData.length - 1]);
    });

    const labelOrder = [
        "PM2_5", "PM10", "SO2", "NO2", "CO", "O3", "TEMP", "PRES", "DEWP", "RAIN"
    ];

    labelOrder.forEach((attr, index) => {
        labelsGroup.append("text")
            .attr("x", (index % 5) * 120)
            .attr("y", Math.floor(index / 5) * 20)
            .text(attr)
            .style("fill", attributeColors[attr])
            .style("font-size", "14px")
            .style("font-weight", "bold");
    });

    // Llamada inicial para dibujar la gráfica con las fechas y las líneas
    updateGraph([0, normalizedData.length - 1]);
}


//GRAFICA DE DISTRIBUCION TEMPORAL GLOBAL
// Variables globales
let activeGraph = null; // Track the currently active graph
let globallySelectedPoints = new Set(); // Global set of selected points
let currentFilename = 'pca_unido_promediado2.csv'; // Global dataset filename

// Colores para los clusters (incluyendo HDBSCAN y -1)
const clusterColors = {
    'Kmeans_3': { '-1': 'rgba(128, 128, 128, 0.5)',0: '#1b9e77', 1: '#d95f02', 2: '#7570b3' },
    'Kmeans_4': { '-1': 'rgba(128, 128, 128, 0.5)',0: '#66c2a5', 1: '#fc8d62', 2: '#8da0cb', 3: '#e78ac3' },
    'Kmeans_6': { '-1': 'rgba(128, 128, 128, 0.5)',0: '#fdae61', 1: '#fee08b', 2: '#d73027', 3: '#4575b4', 4: '#313695', 5: '#91bfdb' },
    'Kmeans_12': { '-1': 'rgba(128, 128, 128, 0.5)',0: '#a6cee3', 1: '#1f78b4', 2: '#b2df8a', 3: '#33a02c', 4: '#fb9a99', 5: '#e31a1c', 6: '#fdbf6f', 7: '#ff7f00', 8: '#cab2d6', 9: '#6a3d9a', 10: '#ffff99', 11: '#b15928' },
    'HDBSCAN_3': { '-1': 'rgba(128, 128, 128, 0.5)', 0: '#ff9999', 1: '#66b3ff', 2: '#99ff99' },
    'HDBSCAN_4': { '-1': 'rgba(128, 128, 128, 0.5)', 0: '#ff6666', 1: '#3399ff', 2: '#66cc66', 3: '#ffcc66' },
    'HDBSCAN_6': { '-1': 'rgba(128, 128, 128, 0.5)', 0: '#ff3333', 1: '#0066cc', 2: '#33cc33', 3: '#ff9933', 4: '#cc33ff', 5: '#66cccc' },
    'HDBSCAN_12': { '-1': 'rgba(128, 128, 128, 0.5)', 0: '#ff0000', 1: '#0000ff', 2: '#00ff00', 3: '#ffff00', 4: '#ff00ff', 5: '#00ffff', 6: '#990000', 7: '#000099', 8: '#009900', 9: '#999900', 10: '#990099', 11: '#009999' }
};

// Rango de fechas permitido
const minDate = new Date(2013, 2, 1);
const maxDate = new Date(2017, 1, 28);

// Filtros de fecha (globales para todas las gráficas)
let startDateFilter = null;
let endDateFilter = null;

// Estado de selección y transformación por gráfica
const selectionStates = {
    "distribucion-global-graph1": { 
        points: [], selectedData: [], isDrawing: false, data: [], context: null, canvas: null, 
        xScale: null, yScale: null, scale: 1, translateX: 0, translateY: 0, 
        currentClustering: 'Kmeans_3', selectedCluster: null, currentVisualization: 'PCA' 
    },
    "distribucion-global-graph2": { 
        points: [], selectedData: [], isDrawing: false, data: [], context: null, canvas: null, 
        xScale: null, yScale: null, scale: 1, translateX: 0, translateY: 0, 
        currentClustering: 'Kmeans_3', selectedCluster: null, currentVisualization: 'PCA' 
    },
    "distribucion-global-graph3": { 
        points: [], selectedData: [], isDrawing: false, data: [], context: null, canvas: null, 
        xScale: null, yScale: null, scale: 1, translateX: 0, translateY: 0, 
        currentClustering: 'Kmeans_3', selectedCluster: null, currentVisualization: 'PCA' 
    }
};

// Obtener los radio buttons y los botones de clustering
const clusteringRadios = document.querySelectorAll('input[name="clustering"]');
const clusterButtons = {
    3: document.getElementById('cluster-3-btn2'),
    4: document.getElementById('cluster-4-btn2'),
    6: document.getElementById('cluster-6-btn2'),
    12: document.getElementById('cluster-12-btn2')
};

// Función para actualizar el texto de los botones
function updateButtonText(method) {
    const prefix = method === 'kmeans' ? 'Kmeans' : 'HDBSCAN';
    clusterButtons[3].textContent = `${prefix} 3`;
    clusterButtons[4].textContent = `${prefix} 4`;
    clusterButtons[6].textContent = `${prefix} 6`;
    clusterButtons[12].textContent = `${prefix} 12`;
}
// Datos seleccionados para series temporales
let selectedDataForTimeSeries = null;

const aqiColors = ['#00e400', '#ff0', '#ff7e00', '#f00', '#99004c', '#7e0023'];
const meteorologicalColor = 'blue';

// Función para calcular la categoría del AQI genérica
function calculateAQICategory(value) {
    if (value <= 50) return 1;
    else if (value <= 100) return 2;
    else if (value <= 150) return 3;
    else if (value <= 200) return 4;
    else if (value <= 300) return 5;
    else return 6;
}

function getAQICategoryForCO(value) {
    if (value <= 2) return 1;
    else if (value <= 4) return 2;
    else if (value <= 6) return 3;
    else if (value <= 8) return 4;
    else if (value <= 10) return 5;
    else return 6;
}

// Evento de carga inicial
document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    startDateInput.setAttribute('min', minDate.toISOString().split('T')[0]);
    startDateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
    endDateInput.setAttribute('min', minDate.toISOString().split('T')[0]);
    endDateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);

    initializeCharts();

    // Cambiar dataset
    document.querySelectorAll('input[name="dataset"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                currentFilename = this.value;
                globallySelectedPoints = new Set();
                loadAndUpdateCharts();
            }
        });
    });

    // Cambiar método de clustering (Kmeans o HDBSCAN) en tiempo real
    clusteringRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            const selectedMethod = event.target.value;
            updateButtonText(selectedMethod);
            updateClusteringMethod(selectedMethod);
            loadAndUpdateCharts(); // Actualizar gráficos inmediatamente
        });
    });

    // Botones y selectores de clusters
    const clusterButtonsConfig = {
        'cluster-3-btn2': { clustering: 'Kmeans_3', selectId: 'cluster-3-select2' },
        'cluster-4-btn2': { clustering: 'Kmeans_4', selectId: 'cluster-4-select2' },
        'cluster-6-btn2': { clustering: 'Kmeans_6', selectId: 'cluster-6-select2' },
        'cluster-12-btn2': { clustering: 'Kmeans_12', selectId: 'cluster-12-select2' }
    };

    // Deshabilitar todos los controles inicialmente
    Object.values(clusterButtonsConfig).forEach(item => {
        document.getElementById(item.selectId).disabled = true;
    });

    Object.keys(clusterButtonsConfig).forEach(btnId => {
        const btn = document.getElementById(btnId);
        const select = document.getElementById(clusterButtonsConfig[btnId].selectId);

        btn.addEventListener('click', function() {
            if (activeGraph) {
                const state = selectionStates[activeGraph];
                const method = document.querySelector('input[name="clustering"]:checked').value;
                const prefix = method === 'kmeans' ? 'Kmeans' : 'HDBSCAN';
                state.currentClustering = `${prefix}_${btnId.split('-')[1]}`; // Ejemplo: HDBSCAN_3
                state.selectedCluster = null;
                globallySelectedPoints = new Set();
                updateSelectOptions(select, state.currentClustering);
                select.disabled = false;
                select.value = "";
                updateCharts();
            }
        });

        select.addEventListener('change', function() {
            if (activeGraph) {
                const state = selectionStates[activeGraph];
                state.selectedCluster = this.value ? parseInt(this.value) : null;
                globallySelectedPoints = new Set();
        
                const filteredData = state.data.filter(d => 
                    d[state.currentClustering] === state.selectedCluster &&
                    (!startDateFilter || d.date >= startDateFilter) &&
                    (!endDateFilter || d.date <= endDateFilter)
                );
                selectedDataForTimeSeries = filteredData;
                globallySelectedPoints = new Set(filteredData.map(d => d.date.toISOString() + "_" + d.station));
                
                updateCharts();
                updateStationBarCharts(); // Actualizar gráfica de barras con datos filtrados
        
                // Llamar a la función plotTimeSeries para cada atributo relevante
                const attributes = ["PM2_5", "PM10", "SO2", "NO2", "CO", "O3", "TEMP", "PRES", "DEWP", "RAIN"]; // Lista de atributos a graficar
                attributes.forEach(attr => {
                    plotTimeSeries(attr, filteredData);
                });
            }
        });
    });

    // Filtro de fechas
    document.getElementById('apply-date-filter').addEventListener('click', function() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        startDateFilter = startDate ? new Date(startDate) : null;
        endDateFilter = endDate ? new Date(endDate) : null;
        loadAndUpdateCharts();
    });

    // Estado inicial
    updateButtonText('kmeans');
    updateClusteringMethod('kmeans');
});
// Actualizar método de clustering
function updateClusteringMethod(method) {
    const prefix = method === 'kmeans' ? 'Kmeans' : 'HDBSCAN';
    Object.values(selectionStates).forEach(state => {
        const currentNumClusters = state.currentClustering.split('_')[1];
        state.currentClustering = `${prefix}_${currentNumClusters}`;
        state.selectedCluster = null;
        globallySelectedPoints = new Set();
    });

    // Actualizar selectores
    const clusterButtonsConfig = {
        'cluster-3-btn2': `${prefix}_3`,
        'cluster-4-btn2': `${prefix}_4`,
        'cluster-6-btn2': `${prefix}_6`,
        'cluster-12-btn2': `${prefix}_12`
    };
    Object.keys(clusterButtonsConfig).forEach(btnId => {
        const selectId = btnId.replace('btn2', 'select2');
        const select = document.getElementById(selectId);
        updateSelectOptions(select, clusterButtonsConfig[btnId]);
    });
}

// Actualizar opciones del selector dinámicamente
function updateSelectOptions(select, clustering) {
    select.innerHTML = '<option value="" disabled selected>Elegir Cluster</option>';
    const numClusters = Object.keys(clusterColors[clustering]).length;
    for (let i = -1; i < numClusters - 1; i++) { // Incluye -1 para HDBSCAN
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i === -1 ? 'Ruido (-1)' : `Cluster ${i + 1}`;
        option.style.backgroundColor = clusterColors[clustering][i];
        select.appendChild(option);
    }
}
// Inicializar gráficos
function initializeCharts() {
    setupChart("fusion", currentFilename, "distribucion-global-graph1");
    setupChart("contaminacion", currentFilename, "distribucion-global-graph2");
    setupChart("meteorologia", currentFilename, "distribucion-global-graph3");
}

// Cargar datos y actualizar gráficos
function loadAndUpdateCharts() {
    ["distribucion-global-graph1", "distribucion-global-graph2", "distribucion-global-graph3"].forEach(graphId => {
        const state = selectionStates[graphId];
        state.data = [];
        state.selectedData = [];
        state.points = [];
        state.scale = 1;
        state.translateX = 0;
        state.translateY = 0;
        loadChartData(graphId);
    });
}

// Actualizar gráficos sin recargar datos
function updateCharts() {
    ["distribucion-global-graph1", "distribucion-global-graph2", "distribucion-global-graph3"].forEach(graphId => {
        const state = selectionStates[graphId];
        if (state.context && state.data.length > 0) {
            renderChart(graphId, state.data);
        }
    });
}


// Configurar gráfico de dispersión
function setupChart(tipo, filename, graphId) {
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = 450 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const canvas = d3.select(`#${graphId}`)
        .append("canvas")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("border", "1px solid black")
        .style("border-radius", "5px");

    const context = canvas.node().getContext("2d");
    context.translate(margin.left, margin.top);

    const state = selectionStates[graphId];
    state.canvas = canvas;
    state.context = context;

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    let isPanning = false;
    let startX, startY;

    loadChartData(graphId);

    canvas.on("click", function(event) {
        if (!state.isDrawing && !isPanning) {
            activeGraph = graphId;
            ["distribucion-global-graph1", "distribucion-global-graph2", "distribucion-global-graph3"].forEach(id => {
                const graphState = selectionStates[id];
                graphState.canvas.style("border", id === activeGraph ? "2px solid red" : "1px solid black");
            });

            const clusterButtonsConfig = {
                'cluster-3-btn2': { clustering: 'Kmeans_3', selectId: 'cluster-3-select2' },
                'cluster-4-btn2': { clustering: 'Kmeans_4', selectId: 'cluster-4-select2' },
                'cluster-6-btn2': { clustering: 'Kmeans_6', selectId: 'cluster-6-select2' },
                'cluster-12-btn2': { clustering: 'Kmeans_12', selectId: 'cluster-12-select2' }
            };
            Object.values(clusterButtonsConfig).forEach(item => {
                const select = document.getElementById(item.selectId);
                select.disabled = true;
                if (state.currentClustering === item.clustering) {
                    select.disabled = false;
                    select.value = state.selectedCluster !== null ? state.selectedCluster : "";
                }
            });
        }
    });

    // Eventos de interacción
    canvas.on("mousedown", function(event) {
        if (event.button === 2) {
            state.isDrawing = true;
            state.points = [];
            state.selectedData = [];
            const [x, y] = d3.pointer(event, this);
            const adjustedX = (x - margin.left - state.translateX) / state.scale;
            const adjustedY = (y - margin.top - state.translateY) / state.scale;
            state.points.push([adjustedX, adjustedY]);
            renderChart(graphId, state.data);
        } else if (!isPanning) {
            isPanning = true;
            [startX, startY] = d3.pointer(event, this);
        }
    });

    canvas.on("mousemove", function(event) {
        if (state.isDrawing) {
            const [x, y] = d3.pointer(event, this);
            const adjustedX = (x - margin.left - state.translateX) / state.scale;
            const adjustedY = (y - margin.top - state.translateY) / state.scale;
            state.points.push([adjustedX, adjustedY]);
            renderChart(graphId, state.data);
        } else if (isPanning) {
            const [currentX, currentY] = d3.pointer(event, this);
            state.translateX += currentX - startX;
            state.translateY += currentY - startY;
            startX = currentX;
            startY = currentY;
            renderChart(graphId, state.data);
        } else {
            const [x, y] = d3.pointer(event, this);
            const adjustedX = (x - margin.left - state.translateX) / state.scale;
            const adjustedY = (y - margin.top - state.translateY) / state.scale;
            const closestPoint = findClosestPoint(state.data, adjustedX, adjustedY, state.xScale, state.yScale, state.scale, state.currentVisualization);

            if (closestPoint) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Fecha: ${closestPoint.date.toLocaleDateString()}<br>Estación: ${closestPoint.station}<br>Cluster: ${closestPoint[state.currentClustering] + 1}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            } else {
                tooltip.transition().duration(500).style("opacity", 0);
            }
        }
    });

    canvas.on("mouseup", function(event) {
        if (state.isDrawing) {
            state.isDrawing = false;
            if (state.points.length < 3) {
                state.points = [];
                renderChart(graphId, state.data);
                return;
            }
            state.points.push(state.points[0]);
            state.selectedData = state.data.filter(d => 
                d3.polygonContains(state.points, [state.xScale(d[state.currentVisualization + '1']), state.yScale(d[state.currentVisualization + '2'])])
            );
            globallySelectedPoints = new Set(state.selectedData.map(d => d.date.toISOString() + "_" + d.station));
            selectedDataForTimeSeries = state.selectedData;
            updateTimeSeries();
            updateStationBarCharts();
            console.log(`Puntos seleccionados en ${graphId}:`, state.selectedData.length > 0 ? 
                state.selectedData.map(d => `Fecha: ${d.date.toLocaleDateString()}, Estación: ${d.station}`) : 
                `No se seleccionaron puntos.`);
            updateCharts();
    
            // Llamar a la función plotTimeSeries para cada atributo relevante
            const attributes = ["PM2_5", "PM10", "SO2", "NO2", "CO", "O3", "TEMP", "PRES", "DEWP", "RAIN" ]; // Lista de atributos a graficar
            attributes.forEach(attr => {
                plotTimeSeries(attr, state.selectedData);
            });
        } else {
            isPanning = false;
        }
    });

    canvas.on("contextmenu", event => event.preventDefault());
    canvas.on("mouseleave", () => {
        isPanning = false;
        tooltip.transition().duration(500).style("opacity", 0);
    });

    canvas.on("wheel", function(event) {
        event.preventDefault();
        const delta = event.deltaY;
        const zoomFactor = delta > 0 ? 0.95 : 1.05;
        const [mouseX, mouseY] = d3.pointer(event, this);
        const adjustedMouseX = mouseX - margin.left;
        const adjustedMouseY = mouseY - margin.top;

        const newScale = Math.min(Math.max(state.scale * zoomFactor, 0.1), 10);
        state.translateX = adjustedMouseX - (adjustedMouseX - state.translateX) * (newScale / state.scale);
        state.translateY = adjustedMouseY - (adjustedMouseY - state.translateY) * (newScale / state.scale);
        state.scale = newScale;

        renderChart(graphId, state.data);
    });
}


// Cargar datos del gráfico
function loadChartData(graphId) {
    const tipo = graphId === "distribucion-global-graph1" ? "fusion" :
                 graphId === "distribucion-global-graph2" ? "contaminacion" : "meteorologia";
    const filePath = tipo === "fusion" ? `MODEL-ROBUST/fusion/data_unida/${currentFilename}` :
                     tipo === "contaminacion" ? `MODEL-ROBUST/contaminantes/data_unida/${currentFilename}` :
                     `MODEL-ROBUST/meteorologicos/data_unida/${currentFilename}`;

    d3.csv(filePath).then(data => {
        data.forEach(d => {
            d.date = new Date(+d.year, +d.month - 1, +d.day);
            d.PCA1 = +d.PCA1; d.PCA2 = +d.PCA2;
            d.TSNE1 = +d.TSNE1; d.TSNE2 = +d.TSNE2;
            d.UMAP1 = +d.UMAP1; d.UMAP2 = +d.UMAP2;
            d.Kmeans_3 = +d.Kmeans_3; d.Kmeans_4 = +d.Kmeans_4;
            d.Kmeans_6 = +d.Kmeans_6; d.Kmeans_12 = +d.Kmeans_12;
            d.HDBSCAN_3 = +d.HDBSCAN_3; d.HDBSCAN_4 = +d.HDBSCAN_4;
            d.HDBSCAN_6 = +d.HDBSCAN_6; d.HDBSCAN_12 = +d.HDBSCAN_12;
            d.PM2_5 = +d.PM2_5; d.PM10 = +d.PM10; d.SO2 = +d.SO2;
            d.NO2 = +d.NO2; d.CO = +d.CO; d.O3 = +d.O3;
            d.TEMP = +d.TEMP; d.PRES = +d.PRES; d.DEWP = +d.DEWP;
            d.RAIN = +d.RAIN; d.WSPM = +d.WSPM;
            d.AQI = +d.AQI;
        });

        const filteredData = data.filter(d => 
            (!startDateFilter || d.date >= startDateFilter) &&
            (!endDateFilter || d.date <= endDateFilter)
        );

        const state = selectionStates[graphId];
        state.data = filteredData;
        state.xScale = d3.scaleLinear().domain(d3.extent(filteredData, d => d[state.currentVisualization + '1'])).range([0, 450 - 100]);
        state.yScale = d3.scaleLinear().domain(d3.extent(filteredData, d => d[state.currentVisualization + '2'])).range([250 - 100, 0]);

        renderChart(graphId, filteredData);
    }).catch(error => console.error("Error loading CSV:", error));
}

// Funciones de inicialización y actualización
function initializeCharts() {
    setupChart("fusion", currentFilename, "distribucion-global-graph1");
    setupChart("contaminacion", currentFilename, "distribucion-global-graph2");
    setupChart("meteorologia", currentFilename, "distribucion-global-graph3");
}

function loadAndUpdateCharts() {
    ["distribucion-global-graph1", "distribucion-global-graph2", "distribucion-global-graph3"].forEach(graphId => {
        const state = selectionStates[graphId];
        state.data = [];
        state.selectedData = [];
        state.points = [];
        state.scale = 1;
        state.translateX = 0;
        state.translateY = 0;
        loadChartData(graphId);
    });
}

function updateCharts() {
    ["distribucion-global-graph1", "distribucion-global-graph2", "distribucion-global-graph3"].forEach(graphId => {
        const state = selectionStates[graphId];
        if (state.context && state.data.length > 0) {
            renderChart(graphId, state.data);
        }
    });
}

// Encontrar punto más cercano para tooltip
function findClosestPoint(data, x, y, xScale, yScale, scale, visualization) {
    let closestPoint = null;
    let minDistance = Infinity;
    data.forEach(d => {
        const dx = xScale(d[visualization + '1']) - x;
        const dy = yScale(d[visualization + '2']) - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance && distance < 5 / scale) {
            minDistance = distance;
            closestPoint = d;
        }
    });
    return closestPoint;
}
// Renderizar gráfico
function renderChart(graphId, data) {
    const state = selectionStates[graphId];
    const context = state.context;
    const width = 450 - 100;
    const height = 250 - 100;

    context.save();
    context.clearRect(-50, -50, width + 100, height + 100);
    context.translate(state.translateX, state.translateY);
    context.scale(state.scale, state.scale);

    const xScale = state.xScale.domain(d3.extent(data, d => d[state.currentVisualization + '1']));
    const yScale = state.yScale.domain(d3.extent(data, d => d[state.currentVisualization + '2']));

    data.forEach(d => {
        const x = xScale(d[state.currentVisualization + '1']);
        const y = yScale(d[state.currentVisualization + '2']);
        const key = d.date.toISOString() + "_" + d.station;
        const isSelected = globallySelectedPoints.has(key);
        const clusterValue = d[state.currentClustering];
        const isClusterSelected = state.selectedCluster !== null && clusterValue === state.selectedCluster;

        context.beginPath();
        context.arc(x, y, 2 / state.scale, 0, 2 * Math.PI);

        if (globallySelectedPoints.size > 0) {
            context.globalAlpha = isSelected ? 1 : 0.3;
            context.fillStyle = clusterColors[state.currentClustering][clusterValue] || clusterColors[state.currentClustering]['-1'];
            context.fill();
            if (isSelected) {
                context.strokeStyle = 'black';
                context.lineWidth = 1 / state.scale;
                context.stroke();
            }
        } else if (state.selectedCluster !== null) {
            context.globalAlpha = isClusterSelected ? 1 : 0.3;
            context.fillStyle = clusterColors[state.currentClustering][clusterValue] || clusterColors[state.currentClustering]['-1'];
            context.fill();
            if (isClusterSelected) {
                context.strokeStyle = 'black';
                context.lineWidth = 1 / state.scale;
                context.stroke();
            }
        } else {
            context.globalAlpha = 1;
            context.fillStyle = clusterColors[state.currentClustering][clusterValue] || clusterColors[state.currentClustering]['-1'];
            context.fill();
        }
    });

    if (state.isDrawing && state.points.length > 0) {
        context.globalAlpha = 1;
        context.beginPath();
        context.moveTo(state.points[0][0], state.points[0][1]);
        state.points.forEach(point => context.lineTo(point[0], point[1]));
        context.strokeStyle = 'blue';
        context.lineWidth = 2 / state.scale;
        context.stroke();
    }

    context.restore();
}
// Encontrar punto más cercano para tooltip (corregido)
function findClosestPoint(data, x, y, xScale, yScale, scale, visualization) {
    let closestPoint = null;
    let minDistance = Infinity;
    data.forEach(d => {
        const dx = xScale(d[visualization + '1']) - x;
        const dy = yScale(d[visualization + '2']) - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance && distance < 5 / scale) {
            minDistance = distance;
            closestPoint = d;
        }
    });
    return closestPoint;
}

// Funciones vacías por si las necesitas implementar
function updateTimeSeries() {
    console.log("Time series update called");
}

function plotTimeSeries(attribute, data) {
    console.log(`Plotting time series for ${attribute} with ${data.length} data points`);
}

const stations = [
    "Aotizhongxin", "Changping", "Dongsi", "Guanyuan", "Gucheng", 
    "Nongzhanguan", "Tiantan", "Wanliu", "Wanshouxigong", 
    "Shunyi", "Huairou", "Dingling"
];
const stationAbbreviations = {
    "Aotizhongxin": "AOT",
    "Changping": "CHP",
    "Dongsi": "DSS",
    "Guanyuan": "GYN",
    "Gucheng": "GCH",
    "Nongzhanguan": "NZG",
    "Tiantan": "TTN",
    "Wanliu": "WLU",
    "Wanshouxigong": "WSX",
    "Shunyi": "SHY",
    "Huairou": "HRU",
    "Dingling": "DLG"
};

function updateStationBarCharts() {
    const seasonColors = {
        'Invierno': '#1f78b4',  // Winter
        'Primavera': '#2ca25f', // Spring
        'Verano': '#d95f0e',    // Summer
        'Otoño': '#7570b3',     // Autumn
        'YearRound': '#6a3d9a'  // Not used, kept for completeness
    };

    const aqiColors = ['#00e400', '#ff0', '#ff7e00', '#f00', '#99004c', '#7e0023'];

    const allRanges = [];
    allRanges.push({ season: 'Invierno', start: new Date(2013, 2, 1), end: new Date(2013, 2, 19), days: 19 });
    allRanges.push({ season: 'Primavera', start: new Date(2013, 2, 20), end: new Date(2013, 2, 31), days: 12 });
    allRanges.push({ season: 'Primavera', start: new Date(2013, 3, 1), end: new Date(2013, 3, 30), days: 30 });
    allRanges.push({ season: 'Primavera', start: new Date(2013, 4, 1), end: new Date(2013, 4, 31), days: 31 });
    allRanges.push({ season: 'Primavera', start: new Date(2013, 5, 1), end: new Date(2013, 5, 20), days: 20 });
    allRanges.push({ season: 'Verano', start: new Date(2013, 5, 21), end: new Date(2013, 5, 30), days: 10 });
    allRanges.push({ season: 'Verano', start: new Date(2013, 6, 1), end: new Date(2013, 6, 31), days: 31 });
    allRanges.push({ season: 'Verano', start: new Date(2013, 7, 1), end: new Date(2013, 7, 31), days: 31 });
    allRanges.push({ season: 'Verano', start: new Date(2013, 8, 1), end: new Date(2013, 8, 22), days: 22 });
    allRanges.push({ season: 'Otoño', start: new Date(2013, 8, 23), end: new Date(2013, 8, 30), days: 8 });
    allRanges.push({ season: 'Otoño', start: new Date(2013, 9, 1), end: new Date(2013, 9, 31), days: 31 });
    allRanges.push({ season: 'Otoño', start: new Date(2013, 10, 1), end: new Date(2013, 10, 30), days: 30 });
    allRanges.push({ season: 'Otoño', start: new Date(2013, 11, 1), end: new Date(2013, 11, 21), days: 21 });
    allRanges.push({ season: 'Invierno', start: new Date(2013, 11, 22), end: new Date(2013, 11, 31), days: 10 });

    for (let year = 2014; year <= 2016; year++) {
        allRanges.push({ season: 'Invierno', start: new Date(year, 0, 1), end: new Date(year, 0, 31), days: 31 });
        allRanges.push({ season: 'Invierno', start: new Date(year, 1, 1), end: new Date(year, 1, year % 4 === 0 ? 29 : 28), days: year % 4 === 0 ? 29 : 28 });
        allRanges.push({ season: 'Invierno', start: new Date(year, 2, 1), end: new Date(year, 2, 19), days: 19 });
        allRanges.push({ season: 'Primavera', start: new Date(year, 2, 20), end: new Date(year, 2, 31), days: 12 });
        allRanges.push({ season: 'Primavera', start: new Date(year, 3, 1), end: new Date(year, 3, 30), days: 30 });
        allRanges.push({ season: 'Primavera', start: new Date(year, 4, 1), end: new Date(year, 4, 31), days: 31 });
        allRanges.push({ season: 'Primavera', start: new Date(year, 5, 1), end: new Date(year, 5, 20), days: 20 });
        allRanges.push({ season: 'Verano', start: new Date(year, 5, 21), end: new Date(year, 5, 30), days: 10 });
        allRanges.push({ season: 'Verano', start: new Date(year, 6, 1), end: new Date(year, 6, 31), days: 31 });
        allRanges.push({ season: 'Verano', start: new Date(year, 7, 1), end: new Date(year, 7, 31), days: 31 });
        allRanges.push({ season: 'Verano', start: new Date(year, 8, 1), end: new Date(year, 8, 22), days: 22 });
        allRanges.push({ season: 'Otoño', start: new Date(year, 8, 23), end: new Date(year, 8, 30), days: 8 });
        allRanges.push({ season: 'Otoño', start: new Date(year, 9, 1), end: new Date(year, 9, 31), days: 31 });
        allRanges.push({ season: 'Otoño', start: new Date(year, 10, 1), end: new Date(year, 10, 30), days: 30 });
        allRanges.push({ season: 'Otoño', start: new Date(year, 11, 1), end: new Date(year, 11, 21), days: 21 });
        allRanges.push({ season: 'Invierno', start: new Date(year, 11, 22), end: new Date(year, 11, 31), days: 10 });
    }

    allRanges.push({ season: 'Invierno', start: new Date(2017, 0, 1), end: new Date(2017, 0, 31), days: 31 });
    allRanges.push({ season: 'Invierno', start: new Date(2017, 1, 1), end: new Date(2017, 1, 28), days: 28 });

    allRanges.sort((a, b) => a.start - b.start);

    allRanges.forEach(range => {
        const startStr = range.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        const endStr = range.end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        range.label = `${range.season} (${startStr} - ${endStr})`;
        range.year = range.start.getFullYear();
    });

    function getRangeForDate(date) {
        for (let range of allRanges) {
            if (date >= range.start && date <= range.end) {
                return range;
            }
        }
        return null;
    }

    const counts = {};
    const aqiAverages = {};
    stations.forEach(station => {
        counts[station] = {};
        aqiAverages[station] = {};
        allRanges.forEach(range => {
            const filteredData = selectedDataForTimeSeries ? selectedDataForTimeSeries.filter(item => 
                item.date >= range.start && item.date <= range.end && item.station === station
            ) : [];
            counts[station][range.label] = filteredData.length; // Number of days with data
            const sumAQI = filteredData.reduce((sum, item) => sum + (item.AQI || 0), 0);
            const AQI_avg = filteredData.length > 0 ? Math.round(sumAQI / filteredData.length) : 0;
            aqiAverages[station][range.label] = AQI_avg;
        });
    });

    d3.select("#distribucion-espacio-temporal-graph").selectAll("*").remove();

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    const totalStations = stations.length;
    stations.forEach((station, index) => {
        const stationDiv = d3.select("#distribucion-espacio-temporal-graph")
            .append("div")
            .attr("class", "station-graph")
            .style("margin-bottom", "-1px")
            .style("display", "flex")
            .style("align-items", "center");

        stationDiv.append("h3")
            .style("margin", station === "Dingling" ? "-40px 10px 0 0" : "1 7px 0 0")
            .style("font-size", "14px")
            .style("writing-mode", "vertical-rl")
            .style("transform", "rotate(180deg)")
            .style("color", () => {
                if (["Aotizhongxin", "Changping", "Dongsi", "Guanyuan", "Gucheng", "Nongzhanguan", "Tiantan", "Wanliu", "Wanshouxigong"].includes(station)) {
                    return "#2D6A4F";
                } else if (["Shunyi", "Huairou"].includes(station)) {
                    return "blue";
                } else if (station === "Dingling") {
                    return "#FFB347";
                }
                return "black";
            })
            .text(stationAbbreviations[station]);

        const isLastStation = index === totalStations - 1;
        const svgHeight = isLastStation ? 130 : 70; // Increased height for taller bars

        const svg = stationDiv.append("svg")
            .attr("width", 800)
            .attr("height", svgHeight)
            .style("border", "0px solid black");

        const data = allRanges.map(range => ({
            label: range.label,
            daysWithData: counts[station][range.label], // Number of days with data
            totalDays: range.days, // Total days in the period
            year: range.year,
            season: range.season,
            aqiAvg: aqiAverages[station][range.label]
        }));

        const margin = { top: 0, right: 0, bottom: isLastStation ? 50 : 0, left: 0 };
        const width = 800 - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([0, width])
            .padding(0.02);

        const maxDays = 31; // Maximum number of days in any period
        const y = d3.scaleLinear()
            .domain([0, maxDays]) // Scale based on maximum possible days
            .range([height, 0]);

        g.selectAll(".season-background")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "season-background")
            .attr("x", d => x(d.label))
            .attr("y", 0)
            .attr("width", x.bandwidth())
            .attr("height", height)
            .attr("fill", d => seasonColors[d.season])
            .attr("opacity", 0.2);

        g.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.label))
            .attr("y", d => y(d.daysWithData))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.daysWithData))
            .attr("fill", d => {
                if (d.aqiAvg === 0) {
                    return "white";
                } else {
                    const colorIndex = Math.min(Math.max(d.aqiAvg - 1, 0), 5);
                    return aqiColors[colorIndex];
                }
            })
            .attr("stroke", d => seasonColors[d.season])
            .attr("stroke-width", 2)
            .on("mouseover", function (event, d) {
                const AQI_avg = d.aqiAvg === 0 ? "No data" : d.aqiAvg;
                tooltip.style("visibility", "visible")
                    .html(`<strong>Distrito:</strong> ${station}<br>
                           <strong>Días con datos:</strong> ${d.daysWithData} de ${d.totalDays}<br>
                           <strong>Temporada:</strong> ${d.label}<br>
                           <strong>Promedio AQI:</strong> ${AQI_avg}`);
            })
            .on("mousemove", function (event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
            })
            .on("click", function (event, d) {
                d3.selectAll(".bar").classed("selected", false);
                d3.select(this).classed("selected", true);
                const selectedRange = allRanges.find(range => range.label === d.label);
                if (selectedRange) {
                    const filteredData = selectedDataForTimeSeries.filter(item => 
                        item.date >= selectedRange.start && item.date <= selectedRange.end && item.station === station
                    );
                    console.log(`Datos para la estación: ${station}, Temporada: ${d.label}`);
            
                    filteredData.forEach(item => {
                        if (item.CO) {
                            item.CO = item.CO / 1000;
                        }
                    });
            
                    filteredData.forEach(item => {
                        console.log({
                            Fecha: item.date.toLocaleDateString(),
                            PM2_5: item.PM2_5,
                            PM10: item.PM10,
                            SO2: item.SO2,
                            NO2: item.NO2,
                            CO: item.CO,
                            O3: item.O3,
                            TEMP: item.TEMP,
                            PRES: item.PRES,
                            DEWP: item.DEWP,
                            RAIN: item.RAIN,
                            WSPM: item.WSPM,
                            AQI: item.AQI
                        });
                    });
            
                    generateStackedBarPlot(filteredData, station, selectedRange);
                }
            });

        g.selectAll(".year-separator")
            .data(data)
            .enter()
            .append("line")
            .attr("class", "year-separator")
            .attr("x1", (d, i) => i === data.length - 1 ? x(d.label) + x.bandwidth() : x(d.label) + x.bandwidth())
            .attr("x2", (d, i) => i === data.length - 1 ? x(d.label) + x.bandwidth() : x(d.label) + x.bandwidth())
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "black")
            .attr("stroke-width", (d, i) => {
                if (i === data.length - 1 || data[i + 1].year !== d.year) {
                    return 2;
                }
                return 0;
            });

        g.append("line")
            .attr("class", "year-separator")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "black")
            .attr("stroke-width", 4);

        g.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        if (isLastStation) {
            const yearRanges = {};
            data.forEach((d, i) => {
                if (!yearRanges[d.year]) {
                    yearRanges[d.year] = { start: i, end: i, count: 1 };
                } else {
                    yearRanges[d.year].end = i;
                    yearRanges[d.year].count += 1;
                }
            });

            const yearPositions = Object.keys(yearRanges).map(year => {
                const range = yearRanges[year];
                const middleIndex = range.start + Math.floor((range.end - range.start) / 2);
                return { year, label: data[middleIndex].label };
            });

            const xAxis = d3.axisBottom(x)
                .tickValues(yearPositions.map(d => d.label))
                .tickFormat((d, i) => yearPositions[i].year)
                .tickSize(0);

            g.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height+30})`)
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "middle")
                .style("font-size", "13px");
            g.select(".x-axis .domain")
                .style("stroke", "white");
        }
    });
}

// Placeholder para la función generateStackedBarPlot
function generateStackedBarPlot(data, station, range) {
    console.log(`Generating stacked bar plot for ${station}, ${range.label}`);
}



// Atributos y colores para contaminantes (menos saturados)
const attributesCONT = ['PM2_5', 'PM10', 'SO2', 'NO2', 'CO', 'O3'];
const attributeColorsCONT = {
    'PM2_5': '#FF6666', // Rojo suave
    'PM10': '#FFBB66',  // Naranja suave
    'SO2': '#FFEE99',   // Amarillo suave
    'NO2': '#DD99DD',   // Púrpura suave
    'CO': '#66D9E8',    // Turquesa suave
    'O3': '#6666FF'     // Azul suave
};

// Atributos y colores para meteorología
const attributesMET = ['TEMP', 'PRES', 'DEWP', 'RAIN'];
const attributeColorsMET = {
    'TEMP': '#008000',  // Verde
    'PRES': '#8B0000',  // Rojo oscuro
    'DEWP': '#4B0082',  // Púrpura
    'RAIN': '#1E90FF'   // Azul claro
};

// Unidades de medida para meteorología
const metUnits = {
    'TEMP': '°C',
    'PRES': 'hPa',
    'DEWP': '°C',
    'RAIN': 'mm'
};

function generateStackedBarPlot(filteredData, station, selectedRange) {
    // Agrupar datos por día y calcular promedios para contaminantes y meteorología
    const dailyData = {};
    filteredData.forEach(item => {
        const dayKey = item.date.toLocaleDateString();
        if (!dailyData[dayKey]) {
            dailyData[dayKey] = { count: 0, date: item.date };
            attributesCONT.forEach(attr => dailyData[dayKey][attr] = 0);
            attributesMET.forEach(attr => dailyData[dayKey][attr] = 0);
        }
        dailyData[dayKey].count += 1;
        attributesCONT.forEach(attr => dailyData[dayKey][attr] += item[attr] || 0);
        attributesMET.forEach(attr => dailyData[dayKey][attr] += item[attr] || 0);
    });

    // Calcular promedios diarios y preparar datos
    const data = Object.entries(dailyData).map(([day, values]) => {
        const averages = { day, date: values.date };
        attributesCONT.forEach(attr => {
            averages[attr] = values.count > 0 ? values[attr] / values.count : 0;
        });
        attributesMET.forEach(attr => {
            averages[attr] = values.count > 0 ? values[attr] / values.count : 0;
        });
        return averages;
    });

    // Ordenar por fecha
    data.sort((a, b) => new Date(a.day) - new Date(b.day));

    // Normalizar datos meteorológicos
    const metMinMax = {};
    attributesMET.forEach(attr => {
        const values = data.map(d => d[attr]).filter(v => v !== null && !isNaN(v));
        metMinMax[attr] = {
            min: d3.min(values),
            max: d3.max(values)
        };
    });

    data.forEach(d => {
        attributesMET.forEach(attr => {
            const min = metMinMax[attr].min;
            const max = metMinMax[attr].max;
            d[attr + '_norm'] = (max - min) === 0 ? 0 : (d[attr] - min) / (max - min);
        });
    });

    // Generar el gráfico
    createStackedBarPlot(data, station, selectedRange);
}

function createStackedBarPlot(data, station, selectedRange) {
    // Contenedor principal para los gráficos
    const graphContainer = d3.select("#distribucion-por-periodo-graph")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "40px") // Aumentado de 20px a 40px para más separación horizontal
        .style("overflow-y", "auto")
        .style("max-height", "600px"); // Ajusta la altura máxima según tus necesidades

    // Crear un nuevo contenedor para este gráfico
    const graphId = `graph-${Date.now()}`; // ID único para cada gráfico
    const graphWrapper = graphContainer.append("div")
        .attr("id", graphId)
        .style("position", "relative")
        .style("width", "calc(50% - 20px)") // Ajustado de 10px a 20px para mantener proporción con el gap
        .style("margin-bottom", "-20px")
        .style("margin-left", "-10px") // Aumentado de 10px a 20px para más separación horizontal
        

// Agregar la "X" para eliminar el gráfico
    graphWrapper.append("div")
        .style("position", "absolute")
        .style("top", "50px") // Movido de 10px a 50px para bajar la "X"
        .style("right", "35px")
        .style("cursor", "pointer")
        .style("font-size", "16px")
        .style("color", "red")
        .style("background", "white") // Fondo blanco
        .style("border", "1px solid red") // Borde rojo
        .style("border-radius", "5px") // Bordes redondeados
        .style("padding", "2px 6px") // Espaciado interno
        .style("box-shadow", "1px 1px 5px rgba(0, 0, 0, 0.2)") // Sombra para resaltar
        .text("X")
        .on("click", function () {
            d3.select(`#${graphId}`).remove(); // Eliminar el gráfico al hacer clic en la "X"
        });

    // Configurar el SVG con más espacio en la parte superior para la leyenda
    const margin = { top: 60, right: 60, bottom: 88, left: 40 }; // Aumentar top para la leyenda
    const width = 450 - margin.left - margin.right;
    const height = 380 - margin.top - margin.bottom;

    const svg = graphWrapper.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top + 40})`); // Mover el gráfico hacia abajo

    // Agregar título (nombre de la estación)
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -80) // Ajustar posición Y del título
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(station);

    // Agregar subtítulo (temporada, rango de fechas y estación)
    const startStr = selectedRange.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const endStr = selectedRange.end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -60) // Ajustar posición Y del subtítulo
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(`${selectedRange.season} (${startStr} - ${endStr})`);

    // Crear la leyenda centrada
    const lineLength = 20; // Longitud de la línea
    const spacingX = 80; // Espacio horizontal entre elementos
    const spacingY = 15; // Espacio vertical entre filas
    const legendYStart = -40; // Posición inicial en Y (debajo del subtítulo)

    // Calcular el ancho estimado de cada elemento (línea + espacio + texto aproximado)
    const itemWidth = spacingX; // Usamos spacingX como ancho total por elemento

    // Primera fila: PM2_5, PM10, SO2 (3 elementos)
    const firstRowAttrs = ['PM2_5', 'PM10', 'SO2'];
    const firstRowWidth = firstRowAttrs.length * itemWidth;
    const legendXStartFirst = (width - firstRowWidth) / 2; // Centro de la fila
    firstRowAttrs.forEach((attr, i) => {
        const xPos = legendXStartFirst + i * spacingX;
        svg.append("line")
            .attr("x1", xPos)
            .attr("y1", legendYStart)
            .attr("x2", xPos + lineLength)
            .attr("y2", legendYStart)
            .attr("stroke", attributeColorsCONT[attr])
            .attr("stroke-width", 2);
        svg.append("text")
            .attr("x", xPos + lineLength + 5)
            .attr("y", legendYStart + 4)
            .attr("font-size", "10px")
            .text(attr);
    });

    // Segunda fila: NO2, CO, O3 (3 elementos)
    const secondRowAttrs = ['NO2', 'CO', 'O3'];
    const secondRowWidth = secondRowAttrs.length * itemWidth;
    const legendXStartSecond = (width - secondRowWidth) / 2; // Centro de la fila
    secondRowAttrs.forEach((attr, i) => {
        const xPos = legendXStartSecond + i * spacingX;
        svg.append("line")
            .attr("x1", xPos)
            .attr("y1", legendYStart + spacingY)
            .attr("x2", xPos + lineLength)
            .attr("y2", legendYStart + spacingY)
            .attr("stroke", attributeColorsCONT[attr])
            .attr("stroke-width", 2);
        svg.append("text")
            .attr("x", xPos + lineLength + 5)
            .attr("y", legendYStart + spacingY + 4)
            .attr("font-size", "10px")
            .text(attr);
    });

    // Tercera fila: TEMP, PRES, DEWP, RAIN (4 elementos)
    const thirdRowWidth = attributesMET.length * itemWidth;
    const legendXStartThird = (width - thirdRowWidth) / 2; // Centro de la fila
    attributesMET.forEach((attr, i) => {
        const xPos = legendXStartThird + i * spacingX;
        svg.append("line")
            .attr("x1", xPos)
            .attr("y1", legendYStart + 2 * spacingY)
            .attr("x2", xPos + lineLength)
            .attr("y2", legendYStart + 2 * spacingY)
            .attr("stroke", attributeColorsMET[attr])
            .attr("stroke-width", 2);
        svg.append("text")
            .attr("x", xPos + lineLength + 5)
            .attr("y", legendYStart + 2 * spacingY + 4)
            .attr("font-size", "10px")
            .text(attr);
    });

    // Crear el tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    // Escala X (común para barras y líneas)
    const x = d3.scaleBand()
        .domain(data.map(d => d.day))
        .range([0, width])
        .padding(0.1);

    // Escala Y izquierda (para barras de contaminantes)
    const stack = d3.stack()
        .keys(attributesCONT)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
    const series = stack(data);
    const yLeft = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .nice()
        .range([height, 0]);

    // Escala Y derecha (para líneas meteorológicas normalizadas)
    const yRight = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    // Colores para contaminantes
    const colorCONT = d3.scaleOrdinal()
        .domain(attributesCONT)
        .range(attributesCONT.map(attr => attributeColorsCONT[attr]));

    // Colores para meteorología
    const colorMET = d3.scaleOrdinal()
        .domain(attributesMET)
        .range(attributesMET.map(attr => attributeColorsMET[attr]));

    // Dibujar las barras de contaminantes
    svg.append("g")
        .selectAll("g")
        .data(series)
        .enter()
        .append("g")
        .attr("fill", d => colorCONT(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.day))
        .attr("y", d => yLeft(d[1]))
        .attr("height", d => yLeft(d[0]) - yLeft(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function (event, d) {
            const contaminant = d3.select(this.parentNode).datum().key;
            const value = (d[1] - d[0]).toFixed(2);
            const unit = contaminant === "CO" ? "mg/m³" : "µg/m³";
            tooltip.style("visibility", "visible")
                .html(`<strong>${contaminant}:</strong> ${value} ${unit}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
        });

    // Dibujar series temporales meteorológicas (líneas solo si son continuas, puntos siempre)
    attributesMET.forEach(attr => {
        // Dibujar líneas solo entre días consecutivos
        for (let i = 0; i < data.length - 1; i++) {
            const date1 = new Date(data[i].date);
            const date2 = new Date(data[i + 1].date);
            const diffDays = (date2 - date1) / (1000 * 60 * 60 * 24);

            if (diffDays === 1) { // Días consecutivos
                const line = d3.line()
                    .x((d, idx) => x(d.day) + x.bandwidth() / 2)
                    .y(d => yRight(d[attr + '_norm']))
                    .defined(d => d[attr + '_norm'] !== null && !isNaN(d[attr + '_norm']));

                svg.append("path")
                    .datum([data[i], data[i + 1]])
                    .attr("fill", "none")
                    .attr("stroke", attributeColorsMET[attr])
                    .attr("stroke-width", 2)
                    .attr("d", line);
            }
        }

        // Dibujar puntos en cada día
        svg.selectAll(`.point-${attr}`)
            .data(data.filter(d => d[attr + '_norm'] !== null && !isNaN(d[attr + '_norm'])))
            .enter()
            .append("circle")
            .attr("class", `point-${attr}`)
            .attr("cx", d => x(d.day) + x.bandwidth() / 2)
            .attr("cy", d => yRight(d[attr + '_norm']))
            .attr("r", 3)
            .attr("fill", attributeColorsMET[attr])
            .on("mouseover", function (event, d) {
                const value = d[attr].toFixed(2);
                tooltip.style("visibility", "visible")
                    .html(`<strong>${attr}:</strong> ${value} ${metUnits[attr]}`);
            })
            .on("mousemove", function (event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
            });
    });

    // Eje X
    const xAxis = d3.axisBottom(x)
        .tickFormat(d => d);
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Eje Y izquierdo (contaminantes)
    const yAxisLeft = d3.axisLeft(yLeft);
    svg.append("g")
        .attr("class", "y-axis-left")
        .call(yAxisLeft);

    // Eje Y derecho (meteorología normalizada)
    const yAxisRight = d3.axisRight(yRight);
    svg.append("g")
        .attr("class", "y-axis-right")
        .attr("transform", `translate(${width},0)`)
        .call(yAxisRight);
}



// Graficar serie temporal
function plotTimeSeries(attr, data) {
    const container = d3.select("#series-temporales-" + attr.toLowerCase());
    container.html("");

    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", 650)
        .attr("height", 200)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const stations = [...new Set(data.map(d => d.station))];
    const stationData = stations.map(station => ({
        station,
        values: data.filter(d => d.station === station).sort((a, b) => a.date - b.date)
    }));

    const xScale = d3.scaleTime()
        .domain([d3.min(data, d => d.date), d3.max(data, d => d.date)])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => +d[attr]) || 0, d3.max(data, d => +d[attr]) || 0])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d[attr]))
        .defined(d => !isNaN(d[attr]));

    // Crear un nuevo tooltip para las series temporales
    const timeSeriesTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    stationData.forEach((sd, i) => {
        const values = sd.values;
        const segments = [];
        let currentSegment = [];

        for (let j = 0; j < values.length; j++) {
            if (j > 0 && (values[j].date - values[j - 1].date) > (24 * 60 * 60 * 1000)) {
                // Si la diferencia entre fechas es mayor a un día, es un nuevo segmento
                segments.push(currentSegment);
                currentSegment = [];
            }
            currentSegment.push(values[j]);
        }
        segments.push(currentSegment); // Añadir el último segmento

        segments.forEach(segment => {
            if (segment.length > 1) {
                // Dibujar línea para segmentos continuos
                svg.append("path")
                    .datum(segment)
                    .attr("fill", "none")
                    .attr("stroke", d3.schemeCategory10[i % 10])
                    .attr("stroke-width", 1.5)
                    .attr("d", line)
                    .on("mouseover", function(event) {
                        d3.select(this).attr("stroke-width", 3); // Resaltar la línea
                        timeSeriesTooltip.transition().duration(200).style("opacity", 0.9);
                        timeSeriesTooltip.html(`Estación: ${sd.station}`)
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mousemove", function(event) {
                        timeSeriesTooltip.style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("stroke-width", 1.5); // Volver al grosor original
                        timeSeriesTooltip.transition().duration(500).style("opacity", 0);
                    });
            } else if (segment.length === 1) {
                // Dibujar punto para segmentos no continuos
                const point = segment[0];
                let color;
                if (attr === 'TEMP' || attr === 'PRES' || attr === 'DEWP' || attr === 'RAIN') {
                    color = meteorologicalColor;
                } else if (attr === 'CO') {
                    const co_mg = point['CO'] / 1000; // Convertir de µg/m³ a mg/m³
                    const category = getAQICategoryForCO(co_mg);
                    color = aqiColors[category - 1];
                } else {
                    const category = calculateAQICategory(point[attr]);
                    color = aqiColors[category - 1];
                }

                svg.append("circle")
                    .attr("cx", xScale(point.date))
                    .attr("cy", yScale(point[attr]))
                    .attr("r", 3)
                    .attr("fill", color)
                    .on("mouseover", function(event) {
                        d3.select(this).attr("r", 5); // Resaltar el punto
                        timeSeriesTooltip.transition().duration(200).style("opacity", 0.9);
                        timeSeriesTooltip.html(`Estación: ${sd.station}<br>Fecha: ${point.date.toLocaleDateString()}<br>${attr}: ${point[attr]}`)
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mousemove", function(event) {
                        timeSeriesTooltip.style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("r", 3); // Volver al tamaño original
                        timeSeriesTooltip.transition().duration(500).style("opacity", 0);
                    });
            }
        });
    });

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    const legend = svg.append("g")
        .attr("transform", `translate(${width + 10}, 0)`);

    stationData.forEach((sd, i) => {
        const legendItem = legend.append("g").attr("transform", `translate(0, ${i * 15})`);
        legendItem.append("rect").attr("width", 10).attr("height", 10).attr("fill", d3.schemeCategory10[i % 10]);
        legendItem.append("text").attr("x", 15).attr("y", 7).text(sd.station).style("font-size", "10px");
    });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(attr.replace('_', '.'));
}
