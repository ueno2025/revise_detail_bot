export async function render_data(groupedData) {
    const allRanges = [];
    let revise_num = 0;
    const today = new Date();
    const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(baseDate);
    endDate.setDate(baseDate.getDate() + 7); // 7日後

    // 各企業ごとに修正グループを処理
    groupedData.forEach(company => {

        const groups = company["修正グループ"];
        const latest_account = company["直近短信"];

        groups.forEach(group => {
            revise_num += 1;

            const first = group[0];
            const last = group[group.length - 1];

            const firstDateObj = new Date(today.getFullYear(), first.month - 1, first.day);

            // 今日 〜 7日後の範囲だけに限定
            if (firstDateObj >= baseDate && firstDateObj <= endDate) {
                revise_num += 1;

                allRanges.push({
                    companyCode: company["証券コード"],
                    companyName: company["企業名"],
                    firstDate: { month: first.month, day: first.day },
                    lastDate: { month: last.month, day: last.day },
                    range: group,
                    now_account: latest_account
                });
            }
        });
    });

    // 件数表示
    const sub_text = document.getElementsByClassName("sub-text");
    if (sub_text.length > 0) {
        sub_text[0].innerHTML += ` 合計: ${revise_num}件`;
    }


    allRanges.sort((a, b) => {
        const aDate = new Date(today.getFullYear(), a.lastDate.month - 1, a.lastDate.day);
        const bDate = new Date(today.getFullYear(), b.lastDate.month - 1, b.lastDate.day);

        const aSortDate = aDate >= baseDate ? aDate : new Date(today.getFullYear() + 1, a.lastDate.month - 1, a.lastDate.day);
        const bSortDate = bDate >= baseDate ? bDate : new Date(today.getFullYear() + 1, b.lastDate.month - 1, b.lastDate.day);

        return aSortDate - bSortDate;
    });

    // HTML に表示
    const resultDiv = document.getElementById("resultDiv");
    resultDiv.innerHTML = "";

    allRanges.forEach((item, index) => {
        const container = document.createElement("div");
        container.classList.add("company");
        container.style.cursor = "pointer"; // カーソルを手のマークにする
        // ストライプ用のクラスを付与
        const isOdd = index % 2 === 0;
        if (isOdd) {
            container.classList.add("stripe-odd");
        } else {
            container.classList.add("stripe-even");
        }

        container.innerHTML = `
            <div class="company-info">
                <span class="col code-name">${item.companyCode}：${item.companyName}</span>
                <span class="col period">
                    修正期間: ${item.firstDate.month}月${item.firstDate.day}日 ~ ${item.lastDate.month}月${item.lastDate.day}日
                </span>
                <span class="col count">修正回数: ${item.range.length}</span>
            </div>
        `;

        const newsLink = document.createElement("a");
        newsLink.href = `https://equity.jiji.com/stocks/${item.companyCode}`;
        newsLink.target = "_blank";
        newsLink.rel = "noopener noreferrer";
        newsLink.classList.add("news-link");
        newsLink.textContent = "最新ニュース";
        newsLink.addEventListener("click", (event) => event.stopPropagation()); // クリックされてもchild_Divを開かないようにする
        if (isOdd) {
            newsLink.classList.add("news-link-odd"); // containerと同じクラスを適用
        } else {
            newsLink.classList.add("news-link-even")
        }
        container.appendChild(newsLink);

        const child_Div = document.createElement("div");
        child_Div.style.display = "none";
        child_Div.classList.add("details");

        const tableHeader = `
        <tr>
            <th>開示日</th>
            <th>売上</th>
            <th>営利</th>
            <th>経常</th>
            <th>純利</th>
        </tr>
        `;

        // 増減率、進捗率用に開示日で並び替える。今までのソートは月日だけでソート。これは年月日でソート
        const sortedRange = [...item.range].sort((a, b) => {
            const dateA = new Date(
                parseInt(a.date.slice(0, 4), 10),
                parseInt(a.date.slice(4, 6), 10) - 1,
                parseInt(a.date.slice(6, 8), 10)
            );
            const dateB = new Date(
                parseInt(b.date.slice(0, 4), 10),
                parseInt(b.date.slice(4, 6), 10) - 1,
                parseInt(b.date.slice(6, 8), 10)
            );
            return dateA - dateB;
        });

        const tableRows = sortedRange.map(element => {
            const keys = ["売上高", "営業利益", "経常利益", "純利益"];

            // 増減率(imgパスを通す)
            const increaseRow = `
            <tr>
                <td>${element.quarter}</td>
                ${keys.map(k => {
                const value = element.increase_rate?.[k];
                let imgSrc;

                if (value === null || value === undefined) {
                    imgSrc = "img/null.png";
                } else if (value > 0) {
                    imgSrc = "img/up.png";
                } else if (value < 0) {
                    imgSrc = "img/down.png";
                } else { // value === 0
                    imgSrc = "img/flat.png";
                }

                return `<td><img src="${imgSrc}" alt="" width="20" height="20" class="td-img"></td>`;
            }).join("")}
            </tr>
            `;

            //進捗率
            const progressRow = `
                <tr>
                <td>進捗率</td>
                ${keys.map(k => `<td>${element.progress_rate?.[k]?.toFixed(1) ?? "-"}%</td>`).join("")}
                </tr>
            `;

            return increaseRow + progressRow;
        }).join("");

        const lastRows = item.now_account.map(element => {
            const keys = ["売上高", "営業利益", "経常利益", "純利益"];
            const progressRow = `
                <tr>
                <td>直近進捗率<br>${element.quarter}</td>
                ${keys.map(k => `<td>${element.progress_rate?.[k]?.toFixed(1) ?? "-"}%</td>`).join("")}
                </tr>
            `
            return progressRow
        })

        const table = document.createElement("table");
        table.innerHTML = tableHeader + tableRows + lastRows;
        child_Div.appendChild(table);

        container.addEventListener("click", () => {
            // トグル表示
            if (child_Div.style.display === "none") {
                child_Div.style.display = "block";
            } else {
                child_Div.style.display = "none";
            }
        });

        resultDiv.appendChild(container);
        resultDiv.appendChild(child_Div);
    });
}
