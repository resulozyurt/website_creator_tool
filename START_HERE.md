Bu, FieldPie Website Builder projesinin devamı. Önce bağlı klasördeki DEVELOPMENT_LOG.md dosyasını baştan sona oku — kilitli kararlar, adım planı, ilerleme ve "How to resume" talimatları orada. Gerekirse mimari için PROJECT_PLAN.md'ye bak.

Çalışma şeklimiz:
- Benimle Türkçe konuş; tüm kod/yorum/doküman/commit American English.
- Adımlar zaten planlı ve onaylı — her adımda tekrar onay isteme, plana göre ilerle. Yalnızca geri dönüşü olmayan / mimari açıdan kritik bir karar çıkarsa dur ve sor.
- Her adım sonrası: DEVELOPMENT_LOG.md'yi güncelle (checkbox + progress log + commit history), sonra bana American-English bir commit mesajı ver (push'u ben kendi makinemde yapıyorum).
- Her adımda "senin yapman gerekenler" varsa bana sade bir dille ayrıca söyle.
- Yığın: Railway (host + Postgres, node-postgres sürücüsü); Neon yalnızca S3 depolama + AI gateway için. Bu, plan dokümanlarındaki eski "Vercel/Neon" ifadelerinin yerine geçer; DEVELOPMENT_LOG.md yetkili kaynaktır.

Durum: Step 1, 2, 3 bitti. Step 4 — hostname → tenant middleware (subdomain) ile devam et.
