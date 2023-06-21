/**
 * Adabpted from asciichart.js 
 * https://github.com/kroitor/asciichart/
 */

const objects = require('./objects');

const TOKENS = {
    hor: '─',
    vert: '│',
    point: '•',
    square: ['┌', '┬', '┐', '├', '┼', '┤', '└', '┴', '┘'],
    curved: ['╭', '┬', '╮', '├', '┼', '┤', '╰', '┴', '╯'],
    nbsp: '\xa0',
};

const color = (tkn, clr, i, key) => {
    if (!clr) 
        return tkn;

    return `<span class="chart-line cl${i}" style="color:${clr}" onmouseover="h(${i})" onmouseout="u(${i})" data-key="${key}">${tkn}</span>`;
};

/**  
 * Reworking of color generation from
 * https://krazydad.com/tutorials/makecolors.php 
 */
const gen_colors = (n) => { 
    if (n == 0) return [];
    let f = 2.4, p = -2, w = 127, c = 128;
    let form = () => { 
        p += 2;
        return Math.abs(Math.sin(f * n + p) * c + w)
    }
    let rgb = Array(3).fill().map(_ => form());
    return [`rgb(${rgb.join()})`].concat(gen_colors(n - 1));
};

function legend(keys, colors) {
    const legend = keys.map((k, i) => {
        let curr_clr = colors[i % colors.length];
        return `<span class="legend-key" id="lk${i}">${color(TOKENS.hor, curr_clr, i)} ${k}</span>`;
    }).join('\n');
    return `<div class="legend">${legend}</div>`
}

function plot(data, layout = {}) {
    if (typeof (data[0]) == 'number') {
        data = [data];
    }

    let min = layout.min ?? Math.min(...data.map(x => Math.min(...x))),
        max = layout.max ?? Math.max(...data.map(x => Math.max(...x)));
    let range = max - min;

    let padding = layout.padding ?? 0;
    let height = layout.height ?? range;
    let width = /*layout.width ??*/ Math.max(...data.map(x => x.length));
    let colors = layout.colors ?? [];
    let style = layout.style ?? 'curved';
    let title = layout.title ?? '';
    let has_legend = layout.has_legend ?? false;
    let keys = layout.keys || Array(max).fill('');

    let ratio = range != 0 ? height / range : 1;
    let rmin = Math.round(min * ratio);
    let rmax = Math.round(max * ratio);
    let rows = (rmax - rmin);

    
    let yticks = layout.yticks ?? rows;
    let ygap = layout.ygap ?? ((yticks != 0) ? Math.round((rows + 1) / yticks) : 1);

    let decs = 2; // number of decimal places
    let shift = (rmax + '').length + decs + 1; // digit shift for y-axis alignment
    let format = layout.format ?? ((n) => {
        let l = (n == null) ? TOKENS.nbsp.repeat(shift + 1) 
            : (TOKENS.nbsp.repeat(shift) + n.toFixed(decs)).slice(-shift - 1)
        return TOKENS.nbsp.repeat(padding) + l;
    })

    let offset = yticks > 0 ? 3 : 1; // graph start offset
    let yaxis = [...Array(rows + 1)].map(_ => Array(offset).fill(TOKENS.nbsp))
    let plane = [...Array(rows + 1)].map(_ => Array(width).fill(TOKENS.nbsp));

    for (let i = 0, y = rmin; y <= rmax; ++y) { // yaxis + labels
        let label, token;
        if (i++ % ygap == 0) {
            label = format(rows > 0 ? max - (y - rmin) * range / rows : y);
            token = TOKENS[style][5];
        } else {
            label = format();
            token = TOKENS.vert;
        }
        yaxis[y - rmin][Math.max(offset - label.length + 1, 0)] = label;
        yaxis[y - rmin][offset] = token;
    }

    // check if outside plotting region
    const outside = (p) => p < 0 || p >= plane.length; 

    for (let j = 0; j < data.length; j++) {
        let curr_clr = colors[j % colors.length];

        for (let x = 0; x < data[j].length - 1; x++) { // plot the line
            let y0 = Math.round(data[j][x + 0] * ratio) - rmin;
            let y1 = Math.round(data[j][x + 1] * ratio) - rmin;
            if (y0 == y1) {
                if (outside(rows - y0)) continue;
                plane[rows - y0][x] = color(TOKENS.hor, curr_clr, j, keys[j]);
            } else {
                if (!outside(rows - y1)) {
                    plane[rows - y1][x] = color(
                        (y0 > y1) ? TOKENS[style][6] : TOKENS[style][0], curr_clr, j, keys[j]);
                }
                if (!outside(rows - y0)) {
                    plane[rows - y0][x] = color(
                        (y0 > y1) ? TOKENS[style][2] : TOKENS[style][8], curr_clr, j, keys[j]);
                }
                let from = Math.min(y0, y1);
                let to = Math.max(y0, y1);
                for (let y = from + 1; y < to; y++) {
                    if (outside(rows - y)) continue;
                    plane[rows - y][x] = color(TOKENS.vert, curr_clr, j, keys[j]);
                }
            }
        }
    }

    let title_len = title.length;
    if (title_len > 0) {
        let title_card = [title];
        plane.unshift([]); // break between chart and title
        plane.unshift(title_card);
    }

    return `
        <div class="yaxis">${yaxis.map(r => r.join('')).join('\n')}</div>
        <div class="plane">${plane.map(r => r.join('')).join('\n')}</div>
        ${(has_legend) ? legend(keys, colors) : '<div class="empty-legend"></div>'}
    `;
}

function build_user_chart(data, max) {
    let min = 1;

    let keys = Object.keys(data).map(k => k.split(/%(.*)/)[1]);
    let values = Object.values(data);
    values = values.map(x => x.map(y => max - y));

    let clr_count = Object.keys(objects.within_index(data, min - 1, max)).length;

    let format = (n) => {
        return (n == null) ? TOKENS.nbsp.repeat(3)
            : (TOKENS.nbsp.repeat(3) + (max - Math.trunc(n) + min)).slice(-3);
    };

    return plot(values, {
        format,
        min,
        max,
        colors: gen_colors(clr_count),
        yticks: max,
        keys,
    });
}

module.exports = {
    TOKENS,
    plot,
    gen_colors,
    build_user_chart,
};
