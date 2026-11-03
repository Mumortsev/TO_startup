import {test,expect} from '@playwright/test';
test('navigation and interactive tools',async({page})=>{
 await page.goto('./');
 await expect(page.getByText('ДВА МИРА ТВОРЧЕСТВА')).toBeVisible();
 await page.getByRole('button',{name:/ТВОРИ/}).click();
 await page.locator('.world.art .world-enter').click();
 await expect(page.getByRole('heading',{name:/Маленькие идеи/})).toBeVisible();
 await page.getByRole('button',{name:/Открыть рисовалку/}).click();
 await expect(page.locator('canvas')).toBeVisible();
 await page.getByRole('button',{name:/Закрыть рисовалку/}).click();
 await page.locator('button.logo').click();
 await page.getByRole('button',{name:/ЗВУЧИ/}).click();
 await page.locator('.world.music .world-enter').click();
 await expect(page.getByRole('heading',{name:/Не слушай мечту/})).toBeVisible();
 await page.getByRole('button',{name:/Создать свой бит/}).click();
 await expect(page.getByRole('button',{name:/Скачать MP3/})).toBeVisible();
});
test('gallery opens, advances and closes',async({page})=>{
 await page.goto('./art');
 await page.locator('.gallery button').first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Следующее фото'}).click();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('no horizontal page overflow',async({page})=>{
 for(const route of ['./','./art','./music','./art/draw','./music/studio']){
 await page.goto(route);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(overflow,route).toBeLessThanOrEqual(1);
 }
});