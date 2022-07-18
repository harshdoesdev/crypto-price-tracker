import { h, text, runApp } from 'https://unpkg.com/supa-app@0.0.20';

const API_URL = 'https://api.coincap.io/v2/assets';

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const formatPrice = price => formatter.format(price);

const millnames = ['',' K',' M',' B',' T'];

const toHumanReadable = (n) => {
    const millidx = Math.max(0, Math.min(millnames.length - 1, Math.floor(n === 0 ? 0 : Math.log10(Math.abs(n))/3)))

    return `${formatPrice((n / 10**(3 * millidx)).toFixed(0))}${millnames[millidx]}`;
};

const fetchData = (_state, setState) => {
    fetch(API_URL)
        .then(res => res.json())
        .then(({ data }) => setState(state => ({ ...state, data, loading: false })));

    return true;
};

const SortByMarketCap = (setState, desc) => setState(state => ({ 
    ...state, 
    data: [...state.data].sort(({ marketCapUsd: a }, { marketCapUsd: b }) => {
        return desc ? a - b : b - a;
    }) 
}));

const SortByPrice = (setState, desc) => setState(state => ({ 
    ...state, 
    data: [...state.data].sort(({ priceUsd: a }, { priceUsd: b }) => {
        return desc ? a - b : b - a;
    }) 
}));

const SearchByNameOrSymbol = search => ({ name, symbol }) => (
    name.toLowerCase().includes(search) || 
    symbol.toLowerCase().includes(search)
);

const IconSrcMap = {
    BTC: 1,
    LTC: 2,
    ETH: 1027,
    USDT: 5,
    XRP: 52,
    BUSD: 4687,
    DOGE: 74,
    MATIC: 3890,
    USDC: 3408,
    BCH: 1831,
};

const CryptoItem = ({ id, symbol, priceUsd, marketCapUsd, changePercent24Hr }) => (
    h('li', { key: id, className: `crypto-item${changePercent24Hr <= 0 ? ' neg' : ' pos'}` },
        h('span', { className: 'crypto-item-logo' },
            IconSrcMap[symbol] && h('img', { src: `https://s2.coinmarketcap.com/static/img/coins/64x64/${IconSrcMap[symbol]}.png` })
        ),
        h('div', { className: 'crypto-item-g' },
            h('span', { className: 'crypto-item-symbol' }, text(symbol)),
            h('small', { className: 'crypto-item-amt' }, text(`Vol. ${toHumanReadable(marketCapUsd)}`)),
        ),
        h('div', { className: 'crypto-item-g' },         
            h('span', { className: 'crypto-item-dt' }, text(Number(changePercent24Hr).toFixed(2))),
            h('small', { className: 'crypto-item-amt' }, text(formatPrice(priceUsd))),
        )
    )
);

const CryptoList = state => (
    h('ul', { className: 'crypto-list' },
        ...(!state.search 
                ? state.data 
                : state.data
                    .filter(SearchByNameOrSymbol(state.search))
            )
        .map(CryptoItem)
    )
);

const CryptoMain = (state, setState) => (
    h('div', { className: 'crypto-container' },
        h('input', 
            { 
                className: 'crypto-search', 
                type: 'search', 
                placeholder: 'Search By Name, Symbol',
                oninput: e => setState(state => ({ ...state, search: e.target.value.trim().toLowerCase() }))
            }
        ),
        h('div', { className: 'sort-btn-container' },
            h('button', 
                { 
                    className: 'btn sort-btn',
                    onclick: () => setState(state => ({ ...state, mkt_desc: !state.mkt_desc })) 
                }, 
                text('Market Cap '),
                text(state.mkt_desc ? '↑' : '↓')
            ),
            h('button', 
                { 
                    className: 'btn sort-btn',
                    onclick: () => setState(state => ({ ...state, price_desc: !state.price_desc })) 
                }, 
                text('Price '),
                text(state.price_desc ? '↑' : '↓')
            )
        ),
        CryptoList(state)
    )
);

runApp({
    node: document.getElementById('app'),
    state: {
        loading: true,
        mkt_desc: false,
        price_desc: false,
        search: '',
        data: []
    },
    effects: state => [
        [SortByMarketCap, state.mkt_desc],
        [SortByPrice, state.price_desc]
    ],
    subscriptions: state => [
        fetchData
    ],
    view: (state, setState) => {
        return (
            h('div', { className: 'app-container' },
                h('div', { className: 'app-header' },
                    h('h1', { className: 'title' }, text('CryptoPriceTracker'))
                ),
                h('div', { className: 'app-main' },
                    state.loading
                        ? h('p', {}, text('Loading...'))
                        : CryptoMain(state, setState)
                )
            )
        )
    }
})