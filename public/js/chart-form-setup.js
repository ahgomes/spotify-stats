
let form = q('#chart-form');
let chart_container = q('#chart');
let chartarea = q('.chartarea');
form.onsubmit = async (e) => {
    e.preventDefault();
    let body = { count, type, time_range } = Object.fromEntries(new FormData(form).entries());

    // TODO: validations

    let res = await fetch('/refresh_chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(raw => raw.json());
    
    let { error, chart } = res;

    // TODO: error handling

    if (error) {
        console.log(error)
        return;
    }

    chartarea.innerHTML = chart;
    chart_container.scrollIntoView(true);
};
