# คำถามปรนัย Kubernetes + Docker + Nutanix NKP (20 ข้อ)

## 1. หน้าที่หลักของ Docker คืออะไร?
A. จัดการการทำงานของคอนเทนเนอร์  
B. สร้างและรันคอนเทนเนอร์  
C. จัดการเครื่องเสมือน  
D. ให้บริการเครือข่ายสำหรับคลัสเตอร์  

**คำตอบ:** B

---

## 2. องค์ประกอบใดของ Docker ที่ทำหน้าที่รันคอนเทนเนอร์?
A. Docker Hub  
B. Docker Engine  
C. Docker Compose  
D. Docker Swarm  

**คำตอบ:** B

---

## 3. Docker image คืออะไร?
A. คอนเทนเนอร์ที่กำลังรันอยู่  
B. เทมเพลตสำหรับสร้างคอนเทนเนอร์  
C. หน่วยเก็บข้อมูล  
D. อินเทอร์เฟซเครือข่าย  

**คำตอบ:** B

---

## 4. คำสั่งใดใช้สำหรับ build Docker image?
A. docker run  
B. docker start  
C. docker build  
D. docker create  

**คำตอบ:** C

---

## 5. Kubernetes ใช้สำหรับอะไรเป็นหลัก?
A. Container runtime  
B. การจัดการคอนเทนเนอร์ (Orchestration)  
C. การจัดการเครื่องเสมือน  
D. การจัดการฐานข้อมูล  

**คำตอบ:** B

---

## 6. คำสั่งใดใช้ดูคอนเทนเนอร์ที่กำลังรันใน Docker?
A. docker list  
B. docker ps  
C. docker show  
D. docker run  

**คำตอบ:** B

---

## 7. Pod ใน Kubernetes คืออะไร?
A. โหนดในคลัสเตอร์  
B. กลุ่มของคอนเทนเนอร์  
C. หน่วยเก็บข้อมูล  
D. นโยบายเครือข่าย  

**คำตอบ:** B

---

## 8. Object ใดใช้สำหรับเปิดให้แอปใน Kubernetes เข้าถึงจากภายนอก?
A. Pod  
B. Deployment  
C. Service  
D. ConfigMap  

**คำตอบ:** C

---

## 9. CSI (Container Storage Interface) ใน Kubernetes ใช้สำหรับอะไร?
A. จัดการเครือข่าย  
B. จัดการ storage ให้กับ container  
C. จัดการ CPU ของ node  
D. ใช้สำหรับ deploy application  

**คำตอบ:** B

---

## 10. ไฟล์ใดใช้สำหรับกำหนด resource ใน Kubernetes?
A. JSON เท่านั้น  
B. YAML  
C. XML  
D. TXT  

**คำตอบ:** B

---

## 11. คำสั่ง "kubectl apply" ทำหน้าที่อะไร?
A. ลบ resource  
B. นำ configuration ไปใช้กับ Cluster
C. รีสตาร์ทโหนด  
D. ดู log  

**คำตอบ:** B

---

## 12. คำสั่งใดใช้สำหรับติดต่อกับ Kubernetes cluster?
A. kubectl  
B. kubeadm  
C. kubelet  
D. docker  

**คำตอบ:** A

---

## 13. Docker Compose ใช้สำหรับอะไร?
A. รันหลาย container พร้อมกัน  
B. สร้าง Docker image  
C. ตรวจสอบ log  
D. ลบ container  

**คำตอบ:** A

---

## 14. ใน Nutanix NKP, NKP ย่อมาจากอะไร?
A. Nutanix Kernel Platform  
B. Nutanix Kubernetes Platform  
C. Network Kubernetes Protocol  
D. Node Kubernetes Package  

**คำตอบ:** B
s
---

## 15. การคิด License ของ NKP ใช้อะไรเป็นตัวคำนวณ?
A. จำนวน Pod  
B. จำนวน Node  
C. vCPU ของ Worker Node  
D. ขนาด Storage  

**คำตอบ:** C

---

## 16. คำสั่งใดใช้ดู endpoint ของ NKP Dashboard?
A. nkp dashboard  
B. nkp get ui  
C. nkp get dashboard  
D. nkp show endpoint  

**คำตอบ:** C

---

## 17. ในการ shutdown VM ของ NKP ควรปิด VM ใดก่อน?
A. Control Plane VM  
B. PCVM 
C. CVM  
D. VM ที่มีคำว่า (-md0)  

**คำตอบ:** D

---

## 18. หน้าที่หลักของ NKP คืออะไร?
A. แทนที่ Kubernetes  
B. จัดการ workload แบบ container บน Nutanix  
C. จัดการเฉพาะ physical server  
D. ให้บริการฐานข้อมูล  

**คำตอบ:** B

---

## 19. Docker Hub ใช้สำหรับอะไร?
A. ให้บริการ Kubernetes cluster  
B. เป็น repository สำหรับ container image  
C. ให้บริการเครื่องเสมือน  
D. ให้บริการเครือข่าย  

**คำตอบ:** B

---

## 20. เครื่องมือใดที่ NKP ใช้สำหรับเก็บ Container Image?
A. Docker Engine  
B. Harbor  
C. Kubernetes Service  
D. Prism  

**คำตอบ:** B

---

# จบชุดคำถาม