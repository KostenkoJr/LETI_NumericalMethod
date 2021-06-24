//colorArray - массив цветов; берется из файла colors.js

// Графики
let commonChart = null;
let specialChart = null;
let specialChart3 = null;
//Система уравнений
let systems = {};
//Начальные точки
let initialValues = {};
//Итоговые точки
let points = {};
//Отметки времени
let timesLabels = [];

let countOfRows = 2;
//Буквы для добавления новых строк системы
const lettersArray = ['Z', 'A', 'B', 'C', 'D', 'E', 'F'];
//Цвета для графиков


createZrow();


//Обработка нажатия на кнопку добавления строки системы
const buttonAdd = document.querySelector('#addBtn');
buttonAdd.addEventListener('click', e => {
    const div = document.createElement('div');
    div.classList.add('input-group', 'mb-3');

    const span = document.createElement('span');
    span.classList.add('input-group-text');
    const index = countOfRows++;
    span.innerHTML = `X<sub>${index}</sub>' =`;

    const input = document.createElement('input');
    input.classList.add('form-control', 'w-50', 'equation');
    input.type = 'text';

    const spanInit = document.createElement('span');
    spanInit.classList.add('input-group-text');
    spanInit.innerHTML = `X<sub>${index}</sub>(0) =`;

    const inputInit = document.createElement('input');
    inputInit.classList.add('form-control');
    inputInit.type = 'text';

    const spanRemove = document.createElement('span');
    spanRemove.classList.add('input-group-text', 'btn', 'btn-secondary', 'remove-button');
    spanRemove.textContent = "Remove";

    //Обработка нажатия на кнопку удаления строки системы
    spanRemove.addEventListener('click', e => {
        
        spanRemove.parentElement.remove();

    });

    div.appendChild(span);
    div.appendChild(input);
    div.appendChild(spanInit);
    div.appendChild(inputInit);
    div.appendChild(spanRemove);


    buttonAdd.parentNode.insertBefore(div, buttonAdd);

   
});

//Обработка нажатия на кнопку решение
const slnBtn = document.querySelector('#solutionBtn');
slnBtn.addEventListener('click', e => {
    const inputs = document.querySelectorAll('.equation');
    let flagError = 0;
    initialValues = {};
    points = {};
    systems = {};
    timesLabels = [];

    inputs.forEach(i => {
        const span = i.nextElementSibling;
        const iputInit = span.nextElementSibling;

        systems[span.textContent.substring(0, span.textContent.indexOf("("))] = i.value;

        const initialValue = Number.parseFloat(iputInit.value);

        if (isNaN(initialValue)) {
            notifier.show('Error!', `Uncorrect value ${iputInit.value}`, 'danger', '', 4000);
            flagError = 1;
        }
        initialValues[span.textContent.substring(0, span.textContent.indexOf("("))] = iputInit.value;
    });
    if (flagError === 1) {
        return;
    }

    for (let prop in initialValues) {
        points[prop] = [initialValues[prop]];
    }
    try {
        calculate();
    } catch (e) {
        notifier.show('Error!', e.message, 'danger', '', 4000);
    }

});


function calculate() {
    const t = document.querySelector('#time').value;
    const h = document.querySelector('#step').value;
    let h_0 = h / 2;
    for (let n = 0; n < t / h; n++) {

        //Значения точек, используемых на текущей итерации
        const currValues = {};
        for (let point in points) {
            currValues[point] = Number.parseFloat(points[point][n]);
        }

        //Ключи систем (X, Y, Z, ...)
        const keys = Object.keys(points);

        keys.forEach(point => {
            //Код, если строка системы зависит сама от себя
            if (systems[point].includes(point.toString())) {
                const y = currValues[point];
                for (let i = 0; i < 4; i++) {
                    currValues[point] = y + h_0 * (math.evaluate(systems[point], currValues));
                }
            }
            ////Код, если строка системы НЕ зависит сама от себя
            else {
                currValues[point] = Number.parseFloat(currValues[point]) + h_0 * math.evaluate(systems[point], currValues);
            }
        });

        //Обратный порядок вычисления строк
        for (let k = keys.length - 1; k >= 0; k--) {
            currValues[keys[k]] = currValues[keys[k]] + h_0 * (math.evaluate(systems[keys[k]], currValues))
        }

        //Запись новых точек в массивы
        for (let point in currValues) {
            points[point][n + 1] = currValues[point];
        }

        //Запись в массив времени для отображения на графике
        timesLabels.push(h * n);

    }

    //Если графики есть, то удаляем перед отрисовкой новых
    if (commonChart) {
        commonChart.destroy();
    }
    if (specialChart) {
        specialChart.destroy();
    }

    //Отрисовка графиков
    const divSpecialChart = document.querySelector('#specialDiv'); 
    divSpecialChart.classList.remove('visually-hidden');
    const selectValue1 = document.querySelector('#value1');
    const selectValue2 = document.querySelector('#value2');

    selectValue1.innerHTML = '';
    selectValue2.innerHTML = '';

    for (let point in points) {
        const option = document.createElement('option');
        option.value = point;
        option.textContent = point;
        selectValue1.appendChild(option);
    }

    for (let point in points) {
        const option = document.createElement('option');
        option.value = point;
        option.textContent = point;
        selectValue2.appendChild(option);
    }
    selectValue1.options[0].selected = true;
    selectValue2.options[1].selected = true;
    const drawBtn = document.querySelector('.btn-draw');

    drawBtn.addEventListener('click', e => {
        specialChart.destroy();
        drawSpecialChart();
    });

    drawCharts();

}

function drawCharts() {
    //Отрисовка общего графика
    const datasets = [];
    let iterator = 0;
    for (let point in points) {
        const rowSettings = {
            label: point,
            backgroundColor: colorArray[iterator],
            borderColor: colorArray[iterator],
            data: points[point],
            borderWidth: 2
        }
        datasets.push(rowSettings);
        iterator++;
    }

    const data = {
        labels: timesLabels,
        datasets: datasets
    };

    const config = {
        type: 'line',
        data,
        options: {
            elements: {
                point: {
                    radius: 0
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: Math.round(timesLabels[timesLabels.length - 1]),
                    ticks: {
                        stepSize: 2
                    }
                }
            }
        }
    };

    commonChart = new Chart(
        document.getElementById('commonChart'),
        config
    );

    const customArray = [];
    points.X0.forEach(p => {
        customArray.push(Number.parseFloat(p));
    })

    //Отрисовка графика зависимости
    const data2 = {
        labels: customArray,
        datasets: [{
            label: 'X0 on X1',
            backgroundColor: 'brown',
            borderColor: 'brown',
            data: points.X1,
            borderWidth: 2
        }]
    };
    const config2 = {
        type: 'line',
        data: data2,
        options: {
            elements: {
                point: {
                    radius: 0
                }
            },
            scales: {
                x: {
                    type: 'linear',
                }
            }
        }
    };

    specialChart = new Chart(
        document.getElementById('specialChart'),
        config2
    );
}

function createZrow() {
    const buttonAdd = document.querySelector('#addBtn');
    const div = document.createElement('div');
    div.classList.add('input-group', 'mb-3');

    const span = document.createElement('span');
    span.classList.add('input-group-text');
    const index = countOfRows++;
    span.innerHTML = `X<sub>${index}</sub>' =`;

    const input = document.createElement('input');
    input.classList.add('form-control', 'w-50', 'equation');
    input.type = 'text';
    input.value = '(-1)*X0+X1'

    const spanInit = document.createElement('span');
    spanInit.classList.add('input-group-text');
    spanInit.innerHTML = `X<sub>${index}</sub>(0) =`;

    const inputInit = document.createElement('input');
    inputInit.classList.add('form-control');
    inputInit.type = 'text';
    inputInit.value = '-0.634';

    const spanRemove = document.createElement('span');
    spanRemove.classList.add('input-group-text', 'btn', 'btn-secondary', 'remove-button');
    spanRemove.textContent = "Remove";

    //Обработка нажатия на кнопку удаления строки системы
    spanRemove.addEventListener('click', e => {
        
        spanRemove.parentElement.remove();

    });

    div.appendChild(span);
    div.appendChild(input);
    div.appendChild(spanInit);
    div.appendChild(inputInit);
    div.appendChild(spanRemove);


    buttonAdd.parentNode.insertBefore(div, buttonAdd);
}

function drawSpecialChart() {
    const val1 = document.querySelector('#value1').value;
    const val2 = document.querySelector('#value2').value;

    const data2 = {
        labels: points[val1],
        datasets: [{
            label: `${val1} versus ${val2}`,
            backgroundColor: 'brown',
            borderColor: 'brown',
            data: points[val2],
            borderWidth: 2
        }]
    };
    const config2 = {
        type: 'line',
        data: data2,
        options: {
            elements: {
                point: {
                    radius: 0
                }
            },
            scales: {
                x: {
                    type: 'linear',
                }
            }
        }
    };

    specialChart = new Chart(
        document.getElementById('specialChart'),
        config2
    );
}