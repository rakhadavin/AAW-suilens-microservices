Rakha Davin Bani Alamsyah
Microservice Repo : https://github.com/rakhadavin/AAW-suilens-microservices/tree/inventory-service (open in inventory-service branch)
Monolith Repo : https://github.com/rakhadavin/AAW-suilens-monoltih

# PENUGASAN (Bagian 2)

## 13. Mengapa Order Service tidak bisa langsung query tabel `lenses` dalam versi mikroservis?

Pada arsitektur mikroservis, setiap service memiliki **database sendiri (database-per-service)** dan tidak diperbolehkan mengakses database service lain secara langsung. Hal ini dilakukan untuk menjaga **isolasi data dan batas kepemilikan domain**.

Jika Order Service langsung melakukan query ke tabel `lenses` milik Catalog Service, maka akan terjadi beberapa masalah:

- **Tight coupling** antara Order dan Catalog Service.
- Perubahan skema database Catalog dapat merusak Order Service.
- Deployment atau rollback satu service dapat mempengaruhi service lain.
- Batas kepemilikan data menjadi tidak jelas.

Secara prinsip, Order Service hanya boleh mengetahui data dari Catalog melalui **API contract (synchronous)** atau melalui **event / data replication (asynchronous)**.

---

## 14. Apa yang terjadi pada event di RabbitMQ jika tidak ada consumer yang berjalan? Apa yang terjadi ketika consumer mulai berjalan lagi?

Jika message dipublish ke **queue yang durable** dan message bersifat **persistent**, maka message akan tetap tersimpan di RabbitMQ meskipun consumer sedang tidak berjalan. Message tersebut akan **menumpuk dalam queue (backlog)**.

Ketika consumer mulai berjalan kembali, RabbitMQ akan mengirim message tersebut satu per satu untuk diproses sesuai dengan konfigurasi seperti **prefetch dan acknowledgment (ack)**.

Namun terdapat beberapa kondisi lain:

- Jika **queue tidak durable** atau message tidak persistent, maka message dapat hilang ketika broker restart.
- Jika message dipublish ke **exchange tetapi tidak ada queue yang bind** atau routing key tidak cocok, message dapat langsung **terbuang (drop)** kecuali menggunakan konfigurasi seperti `mandatory`, `alternate exchange`, atau **dead-letter queue (DLQ)**.

---

## 15. Mengapa kita menyimpan `lensSnapshot` di record pesanan alih-alih memanggil Catalog Service setiap kali membutuhkan detail lensa?

`lensSnapshot` disimpan untuk menjaga **rekam jejak historis** dari pesanan. Informasi seperti nama lensa, produsen, dan harga pada saat pesanan dibuat akan tetap tersimpan meskipun data di Catalog Service berubah di masa depan.

Jika Order Service selalu mengambil detail lensa secara langsung dari Catalog Service, maka terdapat beberapa risiko:

- Perubahan data katalog (nama, harga, dll.) dapat membuat **pesanan lama tampil tidak akurat**.
- Ketergantungan runtime pada Catalog Service dapat menyebabkan Order Service **gagal menampilkan data pesanan jika Catalog Service sedang down**.

Dengan menggunakan snapshot, Order Service tetap dapat menampilkan informasi pesanan secara konsisten tanpa harus bergantung pada Catalog Service setiap saat.

---

## 16. Dalam monolit, pembuatan pesanan dan notifikasi merupakan satu transaksi atomik. Dalam mikroservis tidak demikian. Apa yang bisa salah?

Dalam arsitektur mikroservis, operasi sering kali tidak berjalan dalam satu transaksi database yang sama. Hal ini dapat menyebabkan beberapa skenario kegagalan, seperti:

- **Order berhasil disimpan tetapi event notifikasi gagal dipublish**, sehingga pesanan ada tetapi notifikasi tidak terkirim.
- **Event berhasil dipublish tetapi gagal diproses oleh Notification Service**, sehingga diperlukan mekanisme retry atau dead-letter queue.
- **Event dipublish lebih dari sekali atau consumer melakukan retry**, yang dapat menyebabkan notifikasi dikirim dua kali jika tidak ada mekanisme idempotency.
- Sistem menjadi **eventually consistent**, di mana pengguna mungkin melihat order terlebih dahulu sementara notifikasi baru muncul beberapa saat kemudian.

Beberapa solusi umum untuk mengatasi masalah ini antara lain:

- **Outbox Pattern**
- **Retry mechanism dan Dead Letter Queue**
- **Idempotency key**
- **Saga / compensation pattern**

---

## 17. Mengapa pemanggilan Catalog → Order dilakukan secara sinkron tetapi Order → Notification dilakukan secara asinkron? Apakah bisa sebaliknya?

Pemanggilan dari **Order Service ke Catalog Service** dilakukan secara **sinkron** karena Order membutuhkan respons langsung ketika membuat pesanan, seperti:

- Validasi `lensId`
- Mengambil detail lensa untuk snapshot
- Memastikan aturan bisnis terpenuhi

Hal ini cocok menggunakan komunikasi **HTTP synchronous request-response**.

Sebaliknya, notifikasi bukan bagian kritis dari proses pembuatan pesanan. Oleh karena itu, komunikasi **Order → Notification** dilakukan secara **asinkron menggunakan RabbitMQ** agar:

- Order tidak gagal hanya karena Notification Service bermasalah
- Sistem lebih tahan terhadap lonjakan beban
- Event dapat diproses ulang jika terjadi kegagalan

Secara teori, pola ini bisa dibalik, tetapi terdapat trade-off.

Jika **Catalog → Order dibuat asinkron**, maka Order tidak dapat langsung memvalidasi atau mengambil detail lensa ketika pesanan dibuat. Sistem harus menggunakan pendekatan lain seperti **local cache atau event replication**.

Jika **Order → Notification dibuat sinkron**, maka kegagalan pada Notification Service dapat menyebabkan proses pembuatan pesanan ikut gagal atau mengalami latency yang tinggi, yang biasanya tidak diinginkan dalam sistem produksi.

![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)
![alt text](image-3.png)


#PENUGASAN (Bagian 3)


# Perbandingan Arsitektur

## (a) Skenario di mana mikroservis lebih tangguh dari monolit

Salah satu skenario di mana arsitektur mikroservis lebih tangguh adalah
ketika terjadi kegagalan pada salah satu layanan, misalnya
**Notification Service**. Dalam arsitektur mikroservis, kegagalan pada
layanan notifikasi tidak akan menghentikan sistem secara keseluruhan.
Pelanggan masih dapat membuat pesanan karena **Order Service** dan
**Inventory Service** tetap berjalan secara independen. Event pesanan
tetap dikirim melalui **RabbitMQ**, dan notifikasi dapat diproses ulang
setelah layanan kembali aktif.

Sebaliknya, dalam arsitektur monolit, semua komponen berjalan dalam satu
aplikasi yang sama. Jika modul notifikasi mengalami error fatal, hal
tersebut dapat menyebabkan keseluruhan aplikasi gagal, bahkan user bisa gagal checkout hanya karena notificatin-service sedang down.


------------------------------------------------------------------------

## (b) Skenario di mana monolit lebih sederhana atau lebih tepat

Meskipun mikroservis memiliki banyak keunggulan dalam skalabilitas dan
ketahanan, monolit sering kali lebih sederhana untuk sistem kecil. Dalam
aplikasi sederhana dengan sedikit fitur, menjalankan beberapa layanan,
database, dan message broker dapat menambah kompleksitas operasional
yang tidak perlu.

Sebagai contoh, dalam aplikasi penyewaan lensa skala kecil, semua fungsi
seperti katalog, inventaris, pesanan, dan notifikasi dapat dengan mudah
dikelola dalam satu aplikasi monolit dengan satu database. Pendekatan
ini mengurangi kebutuhan untuk mengelola komunikasi jaringan antar
layanan, message broker, serta sinkronisasi data antar database.

Selain itu, pengembangan dan debugging monolit biasanya lebih mudah
karena seluruh logika bisnis berada dalam satu codebase. Hal ini membuat
monolit sering menjadi pilihan yang lebih praktis pada tahap awal
pengembangan produk.

------------------------------------------------------------------------

## (c) Apa yang terjadi jika Inventory Service down saat pelanggan mencoba membuat pesanan?

Jika **Inventory Service tidak tersedia** ketika pelanggan mencoba
membuat pesanan, maka **Order Service tidak dapat memverifikasi
ketersediaan stok**. Akibatnya, permintaan pembuatan pesanan akan gagal
karena Order Service tidak dapat melakukan reservasi inventaris.

Dalam implementasi sistem ini, Order Service memanggil Inventory Service
secara sinkron untuk melakukan reservasi stok. Jika layanan tersebut
tidak merespons, permintaan pesanan akan dikembalikan sebagai error
kepada pengguna.

Beberapa strategi mitigasi yang dapat digunakan meliputi:

-   Retry mechanism
-   Circuit breaker pattern
-   Graceful error handling di frontend

Pendekatan lain yang lebih kompleks adalah menggunakan **event-driven
reservation**, di mana pesanan dibuat terlebih dahulu dan reservasi stok
diproses secara asynchronous. Dengan demikian user tetap mengetahui pesanannya berhasil dibuat namun 
notifikasi hanya akan terlambat.

------------------------------------------------------------------------

## (d) Trade-off dan alternatif pendekatan

Salah satu trade-off utama adalah meningkatnya kompleksitas sistem. Mikroservis
memerlukan manajemen jaringan antar layanan, message broker, serta
beberapa database yang berbeda. Hal ini membuat deployment dan debugging
menjadi lebih kompleks dibandingkan monolit.

Namun, keuntungan yang diperoleh adalah **isolasi kegagalan**,
**skalabilitas layanan independen**, serta kemampuan untuk mengembangkan
dan meng-deploy layanan secara terpisah. Misalnya, Inventory Service
dapat diskalakan secara independen jika beban sistem meningkat. Hal ini jauh
lebih aman dari monolith arc. Dikarenakan dengan menggunakan microservice dan msg broker
user akan lebih terhindar dari aksi-aksi merugikan yang tak terduga baik dari segi sistem maupun user itu sendiri, akibat bantuan error prevention dan penanganan sistem yang lebih adaptif. 

Pendekatan alternatif yang dapat digunakan adalah **modular monolith**,
di mana aplikasi tetap berjalan sebagai satu layanan tetapi memiliki
modul internal yang terpisah secara jelas.



# Port Configuration

  Service                Port    Description
  ---------------------- ------- ----------------------------------
  Frontend               5173    Vue application
  Catalog Service        3001    Lens catalog API
  Order Service          3002    Order management API
  Notification Service   3003    Notification processing
  Inventory Service      3004    Inventory and stock management
  RabbitMQ AMQP          5672    Message broker
  RabbitMQ Dashboard     15672   RabbitMQ web UI
  Catalog DB             15444   PostgreSQL catalog database
  Order DB               5434    PostgreSQL order database
  Notification DB        5435    PostgreSQL notification database
  Inventory DB           5436    PostgreSQL inventory database



  
# Using the System (after running frontend service using )

## Create Order
0.  Run frontend using "bun dev"
1.  Open the frontend.
2.  Click **Create Order**.
3.  Choose a **lens**.
4.  Choose a **branch** with available stock.
5.  Set start and end date.
6.  Click **Create Order**.

The system will:

1.  Call Inventory Service to reserve stock.
2.  Save the order.
3.  Publish an event to RabbitMQ.

Setelah msg di publish, broker akan menyimpan order sebagai antrian 

------------------------------------------------------------------------

## Cancel Order

Click **Cancel Latest Order**.

Order Service will call:

    PATCH /api/orders/:id/cancel

An event `order.cancelled` will be published and Inventory Service will
release the reserved stock.

## Implementation Overview

Sistem ini diimplementasikan menggunakan arsitektur **microservices** yang memisahkan domain utama aplikasi menjadi beberapa layanan independen. Setiap service memiliki tanggung jawab spesifik serta database masing-masing untuk menjaga isolasi data.

Service yang digunakan dalam sistem ini antara lain:

- **Catalog Service** – menyediakan data lensa yang tersedia untuk disewa.
- **Inventory Service** – mengelola stok lensa pada setiap cabang.
- **Order Service** – menangani pembuatan dan pembatalan pesanan.
- **Notification Service** – memproses event notifikasi dari sistem.
- **RabbitMQ** – message broker untuk komunikasi event antar service.
- **Frontend (Vue)** – antarmuka pengguna untuk melakukan operasi sistem.

Order Service melakukan reservasi stok dengan memanggil Inventory Service. Ketika pesanan dibatalkan, Order Service mempublikasikan event `order.cancelled` melalui RabbitMQ, yang kemudian dikonsumsi oleh Inventory Service untuk mengembalikan stok secara **idempotent**.

---

## Implementation Assumptions

Beberapa asumsi yang digunakan dalam implementasi sistem ini adalah:

- Setiap service memiliki **database terpisah** untuk menjaga isolasi data antar domain.
- Komunikasi antar service dilakukan melalui **REST API untuk synchronous call** dan **RabbitMQ untuk asynchronous event**.
- Inventory reservation dilakukan secara **synchronous call dari Order Service ke Inventory Service**.
- Event `order.cancelled` digunakan sebagai mekanisme **compensating action** untuk mengembalikan stok ketika pesanan dibatalkan.
- Operasi pembatalan dibuat **idempotent** agar event yang diproses lebih dari sekali tidak menyebabkan inkonsistensi stok.

---

## Microservice vs Monolithic Analysis

Arsitektur microservices memberikan keuntungan dalam **isolasi kegagalan dan skalabilitas layanan**. Dalam sistem ini, kegagalan pada satu service seperti Notification Service tidak akan menghentikan keseluruhan sistem karena setiap service berjalan secara independen.

Namun, microservices juga meningkatkan kompleksitas sistem karena membutuhkan manajemen beberapa service, database, serta komunikasi jaringan antar service. Untuk sistem yang lebih kecil, arsitektur **monolithic** seringkali lebih sederhana karena seluruh logika aplikasi berada dalam satu codebase dan satu database.

Pendekatan microservices pada sistem ini dipilih untuk menunjukkan bagaimana **service isolation, event-driven communication, dan failure recovery** dapat diimplementasikan dalam sistem terdistribusi.

---

## Testing

Bagian ini saya buat untuk memudahkan scoring criteria based on docs.

### Run the test
Anda dapat menjalankan test dengan cara 
- Masuk ke folder test (cd tests)
- Jalankan (bun run system-test.js) untuk menjalankan test positive case
- Jalnkan (bun run failure-test.js) untuk menjalankan mitigation error case 

### System Test

System test dilakukan untuk memastikan seluruh layanan dalam sistem bekerja dengan benar secara end-to-end. Script `system-test.js` menguji alur lengkap mulai dari mengambil data lensa dari Catalog Service, membaca inventory dari Inventory Service, membuat order melalui Order Service, hingga membatalkan order dan memverifikasi bahwa stok kembali seperti semula. Pengujian ini memastikan komunikasi antar service dan database berjalan dengan benar.

### Failure Test

Failure testing dilakukan dengan mensimulasikan kegagalan layanan untuk melihat bagaimana sistem menangani gangguan. Pada pengujian ini, **Inventory Service sengaja dimatikan** saat proses pembuatan dan pembatalan order berlangsung. Setelah service dinyalakan kembali, sistem melakukan **reconciliation melalui event RabbitMQ** untuk mengembalikan stok secara otomatis sehingga data tetap konsisten.

---

## AI Assistance Disclosure

Dalam pengembangan proyek ini, AI digunakan sebagai alat bantu untuk membantu memahami konsep arsitektur mikroservis, menjelaskan alur kode, serta mengeksplorasi skenario pengujian seperti system test dan failure testing. AI juga digunakan untuk membantu dokumentasi dan penjelasan teknis sistem.

Seluruh implementasi kode, konfigurasi layanan, serta proses pengujian tetap dijalankan, diverifikasi, dan dipahami secara manual oleh pengembang untuk memastikan sistem bekerja sesuai dengan desain yang diharapkan.