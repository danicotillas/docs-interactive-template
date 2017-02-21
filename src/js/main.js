import mainHTML from './text/main.html!text';
import { PimpedYouTubePlayer } from './lib/youtube';
import share from './lib/share';
import sheetToDomInnerHtml from './lib/sheettodom';
import { setStyles } from './lib/dom';
import { isMobile } from './lib/detect';
import sheetNameFromShortId from './lib/sheetnamefromshortid';
import reqwest from 'reqwest';

export function init(el, context, config) {
    const builder = document.createElement('div');
    builder.innerHTML = mainHTML.replace(/%assetPath%/g, config.assetPath);

    const sheetName = sheetNameFromShortId(config.docsArray, window.guardian.config.page.pageId);
    sheetToDomInnerHtml(config.sheetId, sheetName, builder, function callback(resp) {
        var shareFn = share(resp.sheets[sheetName][0].title, window.location);

        [].slice.apply(builder.querySelectorAll('.interactive-share')).forEach(shareEl => {
            var network = shareEl.getAttribute('data-network');
            shareEl.addEventListener('click', () => shareFn(network));
        });


        const youTubeId = resp.sheets[sheetName][0].youTubeId;

        const hiddenDesc = builder.querySelector('#intro-expansion');
        const showMoreBtn = builder.querySelector('#intro-expand-btn');

        //Show the long description
        showMoreBtn.onclick = function() {
            hiddenDesc.classList.toggle('expanded');
        };

        builder.querySelector('.docs__poster--loader').addEventListener('click', function() {
            const player = new PimpedYouTubePlayer(youTubeId, builder, '100%', '100%', config);
            player.play();
        });


        setStyles(builder.querySelector('.docs__poster--image'), {
            'background-image': `url('${resp.sheets[sheetName][0].backgroundImageUrl}')`
        });

        el.parentNode.replaceChild(builder, el);

        const snapLinks = ['One', 'Two', 'Three', 'Four'];
        snapLinks.forEach((snapLink) => {
            const jsonURL = resp.sheets[sheetName][0]['jsonSnap' + snapLink];
            if(jsonURL) {
                reqwest({
                    'url': jsonURL,
                    'type': 'json',
                    'crossOrigin': true,
                    'success': snapJSON => {
                        const el = builder.querySelector('section#more-documentaries .nextSnap' + snapLink);
                        el.innerHTML = snapJSON.html;
                    }
                });
            }
        });

        const autoplayReferrers = [
            /^https?:\/\/localhost:8000/,
            /^https?:\/\/.*.gutools.co.uk/,
            /^https?:\/\/m.code.dev-theguardian.com/,
            /^https?:\/\/www.theguardian.com/
        ];


        const shouldAutoPlay = autoplayReferrers.find(ref => ref.test(document.referrer));

        builder.querySelector('.docs__poster--loader').addEventListener('click', function() {
            const player = new PimpedYouTubePlayer(youTubeId, builder, '100%', '100%', config);
            player.play();
        });

        let autoplayTimeout;

        if (shouldAutoPlay && !isMobile()) {
            builder.querySelector('.docs__poster--title').classList.add('will-autoplay');
            autoplayTimeout = setTimeout(()=> {
                builder.querySelector('.docs__poster--title').classList.remove('will-autoplay');
                const player = new PimpedYouTubePlayer(youTubeId, builder, '100%', '100%', config);
                player.play();
            }, 6000);
        }

        builder.querySelector('.docs__poster--autoplay-stop-button').addEventListener('click', function(e) {
            e.stopPropagation();
            clearTimeout(autoplayTimeout);
            builder.querySelector('.docs__poster--title').classList.remove('will-autoplay');
            builder.querySelector('.docs__poster--title').classList.add('cancelled-autoplay');
        });

    });

    window.addEventListener('scroll', ()=> {
        const s = window.scrollY;
        const bodyHeight = document.querySelector('body').offsetHeight;
        const windowHeight = window.innerHeight;
        const faders = document.querySelectorAll('.should-fade-in');

        if (s===0 && windowHeight<bodyHeight) {
            for (let i = 0; i < faders.length; i++) {
                faders[i].classList.remove('fade-in');
            }
        } else {
            for (let i = 0; i < faders.length; i++) {
                faders[i].classList.add('fade-in');
            }
        }
    });

}
