import { fetch_json } from "./fetch.js";
import { render_data } from "./render.js";


async function main() {

    // ハンバーガーメニューの処理
    $(function () {
        $('.hamburger').click(function () {
            // メニューの開閉状態を切り替える
            $('.menu').toggleClass('open');

            // ハンバーガーボタンのアクティブクラスを切り替えて三本線をバツにする
            $(this).toggleClass('active');
        });
    });


    const processed_data = await fetch_json();
    render_data(processed_data);
    
}


window.addEventListener("DOMContentLoaded", () => {
    main();
});