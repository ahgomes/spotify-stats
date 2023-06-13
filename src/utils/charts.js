/**
 * Reworking of asciichart.js 
 * https://github.com/kroitor/asciichart/
 * 
 */

const TOKENS = {
    hor: '─',
    vert: '│',
    point: '•',
    square: ['┌', '┬', '┐', '├', '┼', '┤', '└', '┴', '┘'],
    curved: ['╭', '┬', '╮', '├', '┼', '┤', '╰', '┴', '╯'],
    nbsp: '\xa0',
    nl: '\n',
};

function plot(data, layout = {}) {
    if (typeof (data[0]) == 'number') {
        data = [data]
    }

    let min = layout.min ?? Math.min(...data.map(x => Math.min(...x))),
        max = layout.max ?? Math.max(...data.map(x => Math.max(...x)));
    let range = max - min;

    let padding = layout.padding ?? 0;
    let height = layout.height ?? range;
    let width = /*layout.width ??*/ Math.max(...data.map(x => x.length));
    let colors = layout.colors ?? [];
    let style = layout.style ?? 'square';

    let ratio = range != 0 ? height / range : 1;
    let rmin = Math.round(min * ratio);
    let rmax = Math.round(max * ratio);
    let rows = rmax - rmin || 1;

    let yticks = layout.yticks ?? rows;
    let ygap = Math.round(rows / yticks);

    let shift = (max + '').length; // digit shift for y-axis alignment
    let format = layout.format ?? ((n) => {
        let l = (n == null) ? TOKENS.nbsp.repeat(shift + 1) 
            : (TOKENS.nbsp.repeat(shift) + n.toFixed(2)).slice(-shift - 1)
        
        return TOKENS.nbsp.repeat(padding) + l;
    })

    let offset = yticks > 0 ? 3 : 1; // graph start offset
    let plane = [...Array(rows + 1)].map(_ => Array(width + offset - 1).fill(TOKENS.nbsp));

    for (let i = ygap, y = rmin; y <= rmax; ++y) { // yaxis + labels
        let label, token;
        if (++i % ygap == 0) {
            label = format(rows > 0 ? max - (y - rmin) * range / rows : y);
            token = TOKENS[style][5];
        } else {
            label = format();
            token = TOKENS.vert;
        }
        plane[y - rmin][Math.max(offset - label.length, 0)] = label;
        plane[y - rmin][offset - 1] = token;
    }

    for (let j = 0; j < data.length; j++) {
        let y0 = Math.round(data[j][0] * ratio) - rmin;
        plane[rows - y0][offset - 1] = (plane[rows - y0][0].trim() != '') ? TOKENS[style][4] : TOKENS[style][3]; // first value

        for (let x = 0; x < data[j].length - 1; x++) { // plot the line
            let y0 = Math.round(data[j][x + 0] * ratio) - rmin;
            let y1 = Math.round(data[j][x + 1] * ratio) - rmin;
            if (y0 == y1) {
                plane[rows - y0][x + offset] = TOKENS.hor;
            } else {
                plane[rows - y1][x + offset] = (y0 > y1) ? TOKENS[style][6] : TOKENS[style][0];
                plane[rows - y0][x + offset] = (y0 > y1) ? TOKENS[style][2] : TOKENS[style][8];
                let from = Math.min(y0, y1);
                let to = Math.max(y0, y1);
                for (let y = from + 1; y < to; y++) {
                    plane[rows - y][x + offset] = TOKENS.vert;
                }
            }
        }
    }

    return plane.map(r => r.join('')).join('\n');
}

function test() {
    return plot([
        //[1, 2, 2, 1],
        [1, 2, 3, 4, 10, 10, 100.7, 10, 9.5, 9.2, 9, 8.7, 8.3, 8, 7].reverse()
    ], { padding: 0, height: 17, style: 'curved', yticks: 4 });
}

// format for top 10
// let format = layout.format ?? ((n) => {
//     let l = (n == null) ? TOKENS.nbsp.repeat(shift + 1)
//         : (TOKENS.nbsp.repeat(shift) + (10 - n + 1)).slice(-shift - 1)
//     return TOKENS.nbsp.repeat(padding) + l;
// })

module.exports = {
    test,
};