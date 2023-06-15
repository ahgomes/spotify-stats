/**
 * Adabpted from asciichart.js 
 * https://github.com/kroitor/asciichart/
 */

const objects = require('./objects');
const { spotify_data, user_data } = require('../../data/');

const TOKENS = {
    hor: '─',
    vert: '│',
    point: '•',
    square: ['┌', '┬', '┐', '├', '┼', '┤', '└', '┴', '┘'],
    curved: ['╭', '┬', '╮', '├', '┼', '┤', '╰', '┴', '╯'],
    nbsp: '\xa0',
};

const color = (tkn, clr) => {
    if (!clr) return tkn;
    return `<span style="color:${clr}">${tkn}</span>`;
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
    return keys.map((k, i) => {
        let curr_clr = colors[i % colors.length];
        return TOKENS.nbsp + color(TOKENS.hor, curr_clr) + TOKENS.nbsp + k;
    }).join('\n');
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
    let style = layout.style ?? 'square';
    let title = layout.title ?? '';

    let ratio = range != 0 ? height / range : 1;
    let rmin = Math.round(min * ratio);
    let rmax = Math.round(max * ratio);
    let rows = (rmax - rmin) || 1;

    
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
    let plane = [...Array(rows + 1)].map(_ => Array(width + offset - 1).fill(TOKENS.nbsp));

    for (let i = 0, y = rmin; y <= rmax; ++y) { // yaxis + labels
        let label, token;
        if (i++ % ygap == 0) {
            label = format(rows > 0 ? max - (y - rmin) * range / rows : y);
            token = TOKENS[style][5];
        } else {
            label = format();
            token = TOKENS.vert;
        }
        plane[y - rmin][Math.max(offset - label.length, 0)] = label;
        plane[y - rmin][offset - 1] = token;
    }

    const outside = (p) => p < 0 || p >= plane.length;

    for (let j = 0; j < data.length; j++) {
        let curr_clr = colors[j % colors.length];

        for (let x = 0; x < data[j].length - 1; x++) { // plot the line
            let y0 = Math.round(data[j][x + 0] * ratio) - rmin;
            let y1 = Math.round(data[j][x + 1] * ratio) - rmin;
            if (y0 == y1) {
                if (outside(rows - y0)) continue;
                plane[rows - y0][x + offset] = color(TOKENS.hor, curr_clr);
            } else {
                if (!outside(rows - y1)) {
                    plane[rows - y1][x + offset] = color(
                        (y0 > y1) ? TOKENS[style][6] : TOKENS[style][0], curr_clr);
                }
                if (!outside(rows - y0)) {
                    plane[rows - y0][x + offset] = color(
                        (y0 > y1) ? TOKENS[style][2] : TOKENS[style][8], curr_clr);
                }
                let from = Math.min(y0, y1);
                let to = Math.max(y0, y1);
                for (let y = from + 1; y < to; y++) {
                    if (outside(rows - y)) continue;
                    plane[rows - y][x + offset] = color(TOKENS.vert, curr_clr);
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

    if (layout.legend != undefined) {
        plane.push([]);
        plane.push([legend(layout.legend, colors)]);
    }

    return plane.map(r => r.join('')).join('\n');
}

async function test(id, access_token, max = 10, type = 'artists', time_range = 'short_term') {
    let a = await user_data.get_user(id);

    let format = (n, max, min) => {
        return (n == null) ? TOKENS.nbsp.repeat(3)
            : (TOKENS.nbsp.repeat(3) + (max - Math.trunc(n) + min)).slice(-3);
    };

    let min = 1/*, max = 10*/;
    //let type = 'tracks';
    let pos = objects.entries_to_keys(a['past_tops'][type][time_range], max);
    //let max = Object.values(pos).length
    //pos = Object.fromEntries(Object.entries(pos).map(e => [e[0], e[1].map(x => (x < 0) ? max : x)]));
    pos = objects.within_index(pos, min - 1, max);
    let data = Object.values(pos)
    let ids = Object.keys(pos);
    let keys = await spotify_data.get_group(access_token, type, ids);
    keys = spotify_data.get_from_items(keys, 'name')
    //data = (Array(max).fill([]).map((_, i) => Array(5).fill(i)));    
    data = data.map(x => x.map(y => max - y)); // FIXME? <-- maybe add within to entries_to_keys??
    console.log(data)
    return plot(data, {
        //title: `top ${max} ${type}`, 
        format: (n) => format(n, min, max),
        min: min,
        max: max,
        colors: gen_colors(max),
        height: (max <= 10) ? (max - 1) * 2 : max - 1, 
        yticks: max,
        legend: keys,
    });
}

module.exports = {
    test,
};
