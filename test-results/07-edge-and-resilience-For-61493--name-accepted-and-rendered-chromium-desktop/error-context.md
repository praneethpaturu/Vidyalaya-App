# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-edge-and-resilience.spec.ts >> Form edge cases >> TC-700 invite with emoji in name accepted and rendered
- Location: tests/qa-e2e/07-edge-and-resilience.spec.ts:7:7

# Error details

```
Test timeout of 20000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 20000ms exceeded.
Call log:
  - waiting for getByLabel(/^role$/i)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "Home — Lakshya School of Excellence" [ref=e6] [cursor=pointer]:
          - /url: /Home
          - img [ref=e8]
          - generic [ref=e11]:
            - generic [ref=e12]: Lakshya School of Excellence
            - generic [ref=e13]: Vidyalaya · School Suite
        - generic [ref=e14]:
          - group "Language" [ref=e15]:
            - button "EN" [pressed] [ref=e16] [cursor=pointer]
            - button "हिं" [ref=e17] [cursor=pointer]
          - generic [ref=e18]:
            - link "What's new" [ref=e19] [cursor=pointer]:
              - /url: "#whats-new"
              - img [ref=e20]
            - button "Favourite menus" [ref=e24] [cursor=pointer]:
              - img [ref=e25]
            - button "Help and resources" [ref=e28] [cursor=pointer]:
              - img [ref=e29]
          - 'button "AY: 2026-2027" [ref=e32] [cursor=pointer]':
            - img [ref=e33]
            - text: "AY: 2026-2027"
            - img [ref=e35]
          - button "Search" [ref=e38] [cursor=pointer]:
            - img [ref=e39]
          - button "App launcher" [ref=e42] [cursor=pointer]:
            - img [ref=e43]
          - button "Notifications" [ref=e54] [cursor=pointer]:
            - img [ref=e55]
          - button "Open profile menu" [ref=e59] [cursor=pointer]:
            - img "Mr. Sudhir Anand" [ref=e60]: MS
            - generic [ref=e61]: Admin
    - generic [ref=e63]:
      - navigation "Breadcrumb" [ref=e64]:
        - button "Toggle favourite" [ref=e65] [cursor=pointer]:
          - img [ref=e66]
        - list [ref=e68]:
          - listitem [ref=e69]: Settings
          - listitem [ref=e70]: ›
          - listitem [ref=e71]: Users
      - navigation "Module navigation" [ref=e74]:
        - link "SIS" [ref=e76] [cursor=pointer]:
          - /url: /Home/SIS
          - text: SIS
          - img [ref=e77]
        - link "HR" [ref=e80] [cursor=pointer]:
          - /url: /Home/HR
          - text: HR
          - img [ref=e81]
        - link "Finance" [ref=e84] [cursor=pointer]:
          - /url: /Home/Finance
          - text: Finance
          - img [ref=e85]
        - link "Admissions" [ref=e88] [cursor=pointer]:
          - /url: /Home/Admissions
          - text: Admissions
          - img [ref=e89]
        - link "Visitor Mgmt" [ref=e92] [cursor=pointer]:
          - /url: /Home/Visitor_Mgmt
          - text: Visitor Mgmt
          - img [ref=e93]
        - link "Transport" [ref=e96] [cursor=pointer]:
          - /url: /Home/Transport
          - text: Transport
          - img [ref=e97]
        - link "Certificates" [ref=e100] [cursor=pointer]:
          - /url: /Home/Certificates
          - text: Certificates
          - img [ref=e101]
        - link "Library" [ref=e104] [cursor=pointer]:
          - /url: /Home/Library
          - text: Library
          - img [ref=e105]
        - link "Hostel" [ref=e108] [cursor=pointer]:
          - /url: /Home/Hostel
          - text: Hostel
          - img [ref=e109]
        - link "Online Exams" [ref=e112] [cursor=pointer]:
          - /url: /Home/Online_Exams
          - text: Online Exams
          - img [ref=e113]
        - link "AI Insights" [ref=e116] [cursor=pointer]:
          - /url: /Home/AI
          - text: AI Insights
          - img [ref=e117]
        - link "Wellness" [ref=e120] [cursor=pointer]:
          - /url: /Home/Wellness
          - text: Wellness
          - img [ref=e121]
        - link "Alumni" [ref=e124] [cursor=pointer]:
          - /url: /Home/Alumni
          - text: Alumni
          - img [ref=e125]
        - link "Reports" [ref=e128] [cursor=pointer]:
          - /url: /Home/Reports
          - text: Reports
          - img [ref=e129]
        - link "Compliance" [ref=e132] [cursor=pointer]:
          - /url: /Home/Compliance
          - text: Compliance
          - img [ref=e133]
      - generic [ref=e135]:
        - button "Help video" [ref=e136] [cursor=pointer]:
          - img [ref=e137]
        - button "More info" [ref=e140] [cursor=pointer]:
          - img [ref=e141]
        - button "Help" [ref=e143] [cursor=pointer]:
          - img [ref=e144]
    - main [ref=e147]:
      - generic [ref=e148]:
        - heading "Users & invitations" [level=1] [ref=e149]
        - paragraph [ref=e150]: Invite teachers, parents, students, and staff to Lakshya School of Excellence.
        - generic [ref=e151]:
          - generic [ref=e152]:
            - heading "Send invitation" [level=2] [ref=e153]
            - paragraph [ref=e154]: An email link will be valid for 7 days.
            - generic [ref=e155]:
              - generic [ref=e156]:
                - generic [ref=e157]: Full name
                - textbox "Full name" [ref=e159]:
                  - /placeholder: Ananya Iyer
                  - text: Aananya 😀 Iyer
              - generic [ref=e160]:
                - generic [ref=e161]: Email
                - textbox "Email" [active] [ref=e163]:
                  - /placeholder: ananya@school.edu.in
                  - text: qa-emoji-1777731903471@vidyalaya-qa.local
              - generic [ref=e164]:
                - text: Role
                - combobox "Role" [ref=e165]:
                  - option "TEACHER" [selected]
                  - option "STUDENT"
                  - option "PARENT"
                  - option "ACCOUNTANT"
                  - option "HR_MANAGER"
                  - option "TRANSPORT_MANAGER"
                  - option "INVENTORY_MANAGER"
                  - option "PRINCIPAL"
                  - option "ADMIN"
              - button "Send invitation" [ref=e166] [cursor=pointer]
          - generic [ref=e167]:
            - heading "Pending invitations (0)" [level=2] [ref=e168]
            - list [ref=e169]:
              - listitem [ref=e170]: No pending invitations.
        - generic [ref=e171]:
          - heading "Members (100)" [level=2] [ref=e172]
          - table [ref=e174]:
            - rowgroup [ref=e175]:
              - row "Name Email Role Last login Status" [ref=e176]:
                - columnheader "Name" [ref=e177]
                - columnheader "Email" [ref=e178]
                - columnheader "Role" [ref=e179]
                - columnheader "Last login" [ref=e180]
                - columnheader "Status" [ref=e181]
            - rowgroup [ref=e182]:
              - row "Suresh Gupta suresh.gupta.162@gmail.com PARENT — Active" [ref=e183]:
                - cell "Suresh Gupta" [ref=e184]
                - cell "suresh.gupta.162@gmail.com" [ref=e185]
                - cell "PARENT" [ref=e186]
                - cell "—" [ref=e187]
                - cell "Active" [ref=e188]
              - row "Sara Gupta sara.gupta.162@dpsbangalore.edu.in STUDENT — Active" [ref=e189]:
                - cell "Sara Gupta" [ref=e190]
                - cell "sara.gupta.162@dpsbangalore.edu.in" [ref=e191]
                - cell "STUDENT" [ref=e192]
                - cell "—" [ref=e193]
                - cell "Active" [ref=e194]
              - row "Pradeep Banerjee pradeep.banerjee.161@gmail.com PARENT — Active" [ref=e195]:
                - cell "Pradeep Banerjee" [ref=e196]
                - cell "pradeep.banerjee.161@gmail.com" [ref=e197]
                - cell "PARENT" [ref=e198]
                - cell "—" [ref=e199]
                - cell "Active" [ref=e200]
              - row "Neel Banerjee neel.banerjee.161@dpsbangalore.edu.in STUDENT — Active" [ref=e201]:
                - cell "Neel Banerjee" [ref=e202]
                - cell "neel.banerjee.161@dpsbangalore.edu.in" [ref=e203]
                - cell "STUDENT" [ref=e204]
                - cell "—" [ref=e205]
                - cell "Active" [ref=e206]
              - row "Manoj Khanna manoj.khanna.160@gmail.com PARENT — Active" [ref=e207]:
                - cell "Manoj Khanna" [ref=e208]
                - cell "manoj.khanna.160@gmail.com" [ref=e209]
                - cell "PARENT" [ref=e210]
                - cell "—" [ref=e211]
                - cell "Active" [ref=e212]
              - row "Krishna Khanna krishna.khanna.160@dpsbangalore.edu.in STUDENT — Active" [ref=e213]:
                - cell "Krishna Khanna" [ref=e214]
                - cell "krishna.khanna.160@dpsbangalore.edu.in" [ref=e215]
                - cell "STUDENT" [ref=e216]
                - cell "—" [ref=e217]
                - cell "Active" [ref=e218]
              - row "Praveen Khanna praveen.khanna.159@gmail.com PARENT — Active" [ref=e219]:
                - cell "Praveen Khanna" [ref=e220]
                - cell "praveen.khanna.159@gmail.com" [ref=e221]
                - cell "PARENT" [ref=e222]
                - cell "—" [ref=e223]
                - cell "Active" [ref=e224]
              - row "Rohan Khanna rohan.khanna.159@dpsbangalore.edu.in STUDENT — Active" [ref=e225]:
                - cell "Rohan Khanna" [ref=e226]
                - cell "rohan.khanna.159@dpsbangalore.edu.in" [ref=e227]
                - cell "STUDENT" [ref=e228]
                - cell "—" [ref=e229]
                - cell "Active" [ref=e230]
              - row "Suresh Kulkarni suresh.kulkarni.158@gmail.com PARENT — Active" [ref=e231]:
                - cell "Suresh Kulkarni" [ref=e232]
                - cell "suresh.kulkarni.158@gmail.com" [ref=e233]
                - cell "PARENT" [ref=e234]
                - cell "—" [ref=e235]
                - cell "Active" [ref=e236]
              - row "Rishi Kulkarni rishi.kulkarni.158@dpsbangalore.edu.in STUDENT — Active" [ref=e237]:
                - cell "Rishi Kulkarni" [ref=e238]
                - cell "rishi.kulkarni.158@dpsbangalore.edu.in" [ref=e239]
                - cell "STUDENT" [ref=e240]
                - cell "—" [ref=e241]
                - cell "Active" [ref=e242]
              - row "Ashok Kumar ashok.kumar.157@gmail.com PARENT — Active" [ref=e243]:
                - cell "Ashok Kumar" [ref=e244]
                - cell "ashok.kumar.157@gmail.com" [ref=e245]
                - cell "PARENT" [ref=e246]
                - cell "—" [ref=e247]
                - cell "Active" [ref=e248]
              - row "Yash Kumar yash.kumar.157@dpsbangalore.edu.in STUDENT — Active" [ref=e249]:
                - cell "Yash Kumar" [ref=e250]
                - cell "yash.kumar.157@dpsbangalore.edu.in" [ref=e251]
                - cell "STUDENT" [ref=e252]
                - cell "—" [ref=e253]
                - cell "Active" [ref=e254]
              - row "Mahesh Saxena mahesh.saxena.156@gmail.com PARENT — Active" [ref=e255]:
                - cell "Mahesh Saxena" [ref=e256]
                - cell "mahesh.saxena.156@gmail.com" [ref=e257]
                - cell "PARENT" [ref=e258]
                - cell "—" [ref=e259]
                - cell "Active" [ref=e260]
              - row "Krishna Saxena krishna.saxena.156@dpsbangalore.edu.in STUDENT — Active" [ref=e261]:
                - cell "Krishna Saxena" [ref=e262]
                - cell "krishna.saxena.156@dpsbangalore.edu.in" [ref=e263]
                - cell "STUDENT" [ref=e264]
                - cell "—" [ref=e265]
                - cell "Active" [ref=e266]
              - row "Naveen Gupta naveen.gupta.155@gmail.com PARENT — Active" [ref=e267]:
                - cell "Naveen Gupta" [ref=e268]
                - cell "naveen.gupta.155@gmail.com" [ref=e269]
                - cell "PARENT" [ref=e270]
                - cell "—" [ref=e271]
                - cell "Active" [ref=e272]
              - row "Vanya Gupta vanya.gupta.155@dpsbangalore.edu.in STUDENT — Active" [ref=e273]:
                - cell "Vanya Gupta" [ref=e274]
                - cell "vanya.gupta.155@dpsbangalore.edu.in" [ref=e275]
                - cell "STUDENT" [ref=e276]
                - cell "—" [ref=e277]
                - cell "Active" [ref=e278]
              - row "Sanjay Patel sanjay.patel.154@gmail.com PARENT — Active" [ref=e279]:
                - cell "Sanjay Patel" [ref=e280]
                - cell "sanjay.patel.154@gmail.com" [ref=e281]
                - cell "PARENT" [ref=e282]
                - cell "—" [ref=e283]
                - cell "Active" [ref=e284]
              - row "Ayaan Patel ayaan.patel.154@dpsbangalore.edu.in STUDENT — Active" [ref=e285]:
                - cell "Ayaan Patel" [ref=e286]
                - cell "ayaan.patel.154@dpsbangalore.edu.in" [ref=e287]
                - cell "STUDENT" [ref=e288]
                - cell "—" [ref=e289]
                - cell "Active" [ref=e290]
              - row "Pradeep Das pradeep.das.153@gmail.com PARENT — Active" [ref=e291]:
                - cell "Pradeep Das" [ref=e292]
                - cell "pradeep.das.153@gmail.com" [ref=e293]
                - cell "PARENT" [ref=e294]
                - cell "—" [ref=e295]
                - cell "Active" [ref=e296]
              - row "Shaurya Das shaurya.das.153@dpsbangalore.edu.in STUDENT — Active" [ref=e297]:
                - cell "Shaurya Das" [ref=e298]
                - cell "shaurya.das.153@dpsbangalore.edu.in" [ref=e299]
                - cell "STUDENT" [ref=e300]
                - cell "—" [ref=e301]
                - cell "Active" [ref=e302]
              - row "Sanjay Gupta sanjay.gupta.152@gmail.com PARENT — Active" [ref=e303]:
                - cell "Sanjay Gupta" [ref=e304]
                - cell "sanjay.gupta.152@gmail.com" [ref=e305]
                - cell "PARENT" [ref=e306]
                - cell "—" [ref=e307]
                - cell "Active" [ref=e308]
              - row "Yash Gupta yash.gupta.152@dpsbangalore.edu.in STUDENT — Active" [ref=e309]:
                - cell "Yash Gupta" [ref=e310]
                - cell "yash.gupta.152@dpsbangalore.edu.in" [ref=e311]
                - cell "STUDENT" [ref=e312]
                - cell "—" [ref=e313]
                - cell "Active" [ref=e314]
              - row "Pradeep Shetty pradeep.shetty.151@gmail.com PARENT — Active" [ref=e315]:
                - cell "Pradeep Shetty" [ref=e316]
                - cell "pradeep.shetty.151@gmail.com" [ref=e317]
                - cell "PARENT" [ref=e318]
                - cell "—" [ref=e319]
                - cell "Active" [ref=e320]
              - row "Mahi Shetty mahi.shetty.151@dpsbangalore.edu.in STUDENT — Active" [ref=e321]:
                - cell "Mahi Shetty" [ref=e322]
                - cell "mahi.shetty.151@dpsbangalore.edu.in" [ref=e323]
                - cell "STUDENT" [ref=e324]
                - cell "—" [ref=e325]
                - cell "Active" [ref=e326]
              - row "Mahesh Kulkarni mahesh.kulkarni.150@gmail.com PARENT — Active" [ref=e327]:
                - cell "Mahesh Kulkarni" [ref=e328]
                - cell "mahesh.kulkarni.150@gmail.com" [ref=e329]
                - cell "PARENT" [ref=e330]
                - cell "—" [ref=e331]
                - cell "Active" [ref=e332]
              - row "Manav Kulkarni manav.kulkarni.150@dpsbangalore.edu.in STUDENT — Active" [ref=e333]:
                - cell "Manav Kulkarni" [ref=e334]
                - cell "manav.kulkarni.150@dpsbangalore.edu.in" [ref=e335]
                - cell "STUDENT" [ref=e336]
                - cell "—" [ref=e337]
                - cell "Active" [ref=e338]
              - row "Mahesh Das mahesh.das.149@gmail.com PARENT — Active" [ref=e339]:
                - cell "Mahesh Das" [ref=e340]
                - cell "mahesh.das.149@gmail.com" [ref=e341]
                - cell "PARENT" [ref=e342]
                - cell "—" [ref=e343]
                - cell "Active" [ref=e344]
              - row "Aarav Das aarav.das.149@dpsbangalore.edu.in STUDENT — Active" [ref=e345]:
                - cell "Aarav Das" [ref=e346]
                - cell "aarav.das.149@dpsbangalore.edu.in" [ref=e347]
                - cell "STUDENT" [ref=e348]
                - cell "—" [ref=e349]
                - cell "Active" [ref=e350]
              - row "Vinod Kumar vinod.kumar.148@gmail.com PARENT — Active" [ref=e351]:
                - cell "Vinod Kumar" [ref=e352]
                - cell "vinod.kumar.148@gmail.com" [ref=e353]
                - cell "PARENT" [ref=e354]
                - cell "—" [ref=e355]
                - cell "Active" [ref=e356]
              - row "Kabir Kumar kabir.kumar.148@dpsbangalore.edu.in STUDENT — Active" [ref=e357]:
                - cell "Kabir Kumar" [ref=e358]
                - cell "kabir.kumar.148@dpsbangalore.edu.in" [ref=e359]
                - cell "STUDENT" [ref=e360]
                - cell "—" [ref=e361]
                - cell "Active" [ref=e362]
              - row "Manoj Banerjee manoj.banerjee.147@gmail.com PARENT — Active" [ref=e363]:
                - cell "Manoj Banerjee" [ref=e364]
                - cell "manoj.banerjee.147@gmail.com" [ref=e365]
                - cell "PARENT" [ref=e366]
                - cell "—" [ref=e367]
                - cell "Active" [ref=e368]
              - row "Prisha Banerjee prisha.banerjee.147@dpsbangalore.edu.in STUDENT — Active" [ref=e369]:
                - cell "Prisha Banerjee" [ref=e370]
                - cell "prisha.banerjee.147@dpsbangalore.edu.in" [ref=e371]
                - cell "STUDENT" [ref=e372]
                - cell "—" [ref=e373]
                - cell "Active" [ref=e374]
              - row "Mahesh Singh mahesh.singh.146@gmail.com PARENT — Active" [ref=e375]:
                - cell "Mahesh Singh" [ref=e376]
                - cell "mahesh.singh.146@gmail.com" [ref=e377]
                - cell "PARENT" [ref=e378]
                - cell "—" [ref=e379]
                - cell "Active" [ref=e380]
              - row "Ayaan Singh ayaan.singh.146@dpsbangalore.edu.in STUDENT — Active" [ref=e381]:
                - cell "Ayaan Singh" [ref=e382]
                - cell "ayaan.singh.146@dpsbangalore.edu.in" [ref=e383]
                - cell "STUDENT" [ref=e384]
                - cell "—" [ref=e385]
                - cell "Active" [ref=e386]
              - row "Vinod Kumar vinod.kumar.145@gmail.com PARENT — Active" [ref=e387]:
                - cell "Vinod Kumar" [ref=e388]
                - cell "vinod.kumar.145@gmail.com" [ref=e389]
                - cell "PARENT" [ref=e390]
                - cell "—" [ref=e391]
                - cell "Active" [ref=e392]
              - row "Vanya Kumar vanya.kumar.145@dpsbangalore.edu.in STUDENT — Active" [ref=e393]:
                - cell "Vanya Kumar" [ref=e394]
                - cell "vanya.kumar.145@dpsbangalore.edu.in" [ref=e395]
                - cell "STUDENT" [ref=e396]
                - cell "—" [ref=e397]
                - cell "Active" [ref=e398]
              - row "Vijay Das vijay.das.144@gmail.com PARENT — Active" [ref=e399]:
                - cell "Vijay Das" [ref=e400]
                - cell "vijay.das.144@gmail.com" [ref=e401]
                - cell "PARENT" [ref=e402]
                - cell "—" [ref=e403]
                - cell "Active" [ref=e404]
              - row "Zara Das zara.das.144@dpsbangalore.edu.in STUDENT — Active" [ref=e405]:
                - cell "Zara Das" [ref=e406]
                - cell "zara.das.144@dpsbangalore.edu.in" [ref=e407]
                - cell "STUDENT" [ref=e408]
                - cell "—" [ref=e409]
                - cell "Active" [ref=e410]
              - row "Rajesh Kumar rajesh.kumar.143@gmail.com PARENT — Active" [ref=e411]:
                - cell "Rajesh Kumar" [ref=e412]
                - cell "rajesh.kumar.143@gmail.com" [ref=e413]
                - cell "PARENT" [ref=e414]
                - cell "—" [ref=e415]
                - cell "Active" [ref=e416]
              - row "Shaurya Kumar shaurya.kumar.143@dpsbangalore.edu.in STUDENT — Active" [ref=e417]:
                - cell "Shaurya Kumar" [ref=e418]
                - cell "shaurya.kumar.143@dpsbangalore.edu.in" [ref=e419]
                - cell "STUDENT" [ref=e420]
                - cell "—" [ref=e421]
                - cell "Active" [ref=e422]
              - row "Mahesh Gupta mahesh.gupta.142@gmail.com PARENT — Active" [ref=e423]:
                - cell "Mahesh Gupta" [ref=e424]
                - cell "mahesh.gupta.142@gmail.com" [ref=e425]
                - cell "PARENT" [ref=e426]
                - cell "—" [ref=e427]
                - cell "Active" [ref=e428]
              - row "Myra Gupta myra.gupta.142@dpsbangalore.edu.in STUDENT — Active" [ref=e429]:
                - cell "Myra Gupta" [ref=e430]
                - cell "myra.gupta.142@dpsbangalore.edu.in" [ref=e431]
                - cell "STUDENT" [ref=e432]
                - cell "—" [ref=e433]
                - cell "Active" [ref=e434]
              - row "Sandeep Kumar sandeep.kumar.141@gmail.com PARENT — Active" [ref=e435]:
                - cell "Sandeep Kumar" [ref=e436]
                - cell "sandeep.kumar.141@gmail.com" [ref=e437]
                - cell "PARENT" [ref=e438]
                - cell "—" [ref=e439]
                - cell "Active" [ref=e440]
              - row "Kiara Kumar kiara.kumar.141@dpsbangalore.edu.in STUDENT — Active" [ref=e441]:
                - cell "Kiara Kumar" [ref=e442]
                - cell "kiara.kumar.141@dpsbangalore.edu.in" [ref=e443]
                - cell "STUDENT" [ref=e444]
                - cell "—" [ref=e445]
                - cell "Active" [ref=e446]
              - row "Vinod Sharma vinod.sharma.140@gmail.com PARENT — Active" [ref=e447]:
                - cell "Vinod Sharma" [ref=e448]
                - cell "vinod.sharma.140@gmail.com" [ref=e449]
                - cell "PARENT" [ref=e450]
                - cell "—" [ref=e451]
                - cell "Active" [ref=e452]
              - row "Zara Sharma zara.sharma.140@dpsbangalore.edu.in STUDENT — Active" [ref=e453]:
                - cell "Zara Sharma" [ref=e454]
                - cell "zara.sharma.140@dpsbangalore.edu.in" [ref=e455]
                - cell "STUDENT" [ref=e456]
                - cell "—" [ref=e457]
                - cell "Active" [ref=e458]
              - row "Manoj Khanna manoj.khanna.139@gmail.com PARENT — Active" [ref=e459]:
                - cell "Manoj Khanna" [ref=e460]
                - cell "manoj.khanna.139@gmail.com" [ref=e461]
                - cell "PARENT" [ref=e462]
                - cell "—" [ref=e463]
                - cell "Active" [ref=e464]
              - row "Shaurya Khanna shaurya.khanna.139@dpsbangalore.edu.in STUDENT — Active" [ref=e465]:
                - cell "Shaurya Khanna" [ref=e466]
                - cell "shaurya.khanna.139@dpsbangalore.edu.in" [ref=e467]
                - cell "STUDENT" [ref=e468]
                - cell "—" [ref=e469]
                - cell "Active" [ref=e470]
              - row "Naveen Banerjee naveen.banerjee.138@gmail.com PARENT — Active" [ref=e471]:
                - cell "Naveen Banerjee" [ref=e472]
                - cell "naveen.banerjee.138@gmail.com" [ref=e473]
                - cell "PARENT" [ref=e474]
                - cell "—" [ref=e475]
                - cell "Active" [ref=e476]
              - row "Shaurya Banerjee shaurya.banerjee.138@dpsbangalore.edu.in STUDENT — Active" [ref=e477]:
                - cell "Shaurya Banerjee" [ref=e478]
                - cell "shaurya.banerjee.138@dpsbangalore.edu.in" [ref=e479]
                - cell "STUDENT" [ref=e480]
                - cell "—" [ref=e481]
                - cell "Active" [ref=e482]
              - row "Sandeep Pillai sandeep.pillai.137@gmail.com PARENT — Active" [ref=e483]:
                - cell "Sandeep Pillai" [ref=e484]
                - cell "sandeep.pillai.137@gmail.com" [ref=e485]
                - cell "PARENT" [ref=e486]
                - cell "—" [ref=e487]
                - cell "Active" [ref=e488]
              - row "Kiara Pillai kiara.pillai.137@dpsbangalore.edu.in STUDENT — Active" [ref=e489]:
                - cell "Kiara Pillai" [ref=e490]
                - cell "kiara.pillai.137@dpsbangalore.edu.in" [ref=e491]
                - cell "STUDENT" [ref=e492]
                - cell "—" [ref=e493]
                - cell "Active" [ref=e494]
              - row "Anil Gupta anil.gupta.136@gmail.com PARENT — Active" [ref=e495]:
                - cell "Anil Gupta" [ref=e496]
                - cell "anil.gupta.136@gmail.com" [ref=e497]
                - cell "PARENT" [ref=e498]
                - cell "—" [ref=e499]
                - cell "Active" [ref=e500]
              - row "Shaurya Gupta shaurya.gupta.136@dpsbangalore.edu.in STUDENT — Active" [ref=e501]:
                - cell "Shaurya Gupta" [ref=e502]
                - cell "shaurya.gupta.136@dpsbangalore.edu.in" [ref=e503]
                - cell "STUDENT" [ref=e504]
                - cell "—" [ref=e505]
                - cell "Active" [ref=e506]
              - row "Rajesh Rao rajesh.rao.135@gmail.com PARENT — Active" [ref=e507]:
                - cell "Rajesh Rao" [ref=e508]
                - cell "rajesh.rao.135@gmail.com" [ref=e509]
                - cell "PARENT" [ref=e510]
                - cell "—" [ref=e511]
                - cell "Active" [ref=e512]
              - row "Arjun Rao arjun.rao.135@dpsbangalore.edu.in STUDENT — Active" [ref=e513]:
                - cell "Arjun Rao" [ref=e514]
                - cell "arjun.rao.135@dpsbangalore.edu.in" [ref=e515]
                - cell "STUDENT" [ref=e516]
                - cell "—" [ref=e517]
                - cell "Active" [ref=e518]
              - row "Ashok Gupta ashok.gupta.134@gmail.com PARENT — Active" [ref=e519]:
                - cell "Ashok Gupta" [ref=e520]
                - cell "ashok.gupta.134@gmail.com" [ref=e521]
                - cell "PARENT" [ref=e522]
                - cell "—" [ref=e523]
                - cell "Active" [ref=e524]
              - row "Yash Gupta yash.gupta.134@dpsbangalore.edu.in STUDENT — Active" [ref=e525]:
                - cell "Yash Gupta" [ref=e526]
                - cell "yash.gupta.134@dpsbangalore.edu.in" [ref=e527]
                - cell "STUDENT" [ref=e528]
                - cell "—" [ref=e529]
                - cell "Active" [ref=e530]
              - row "Vijay Iyer vijay.iyer.133@gmail.com PARENT — Active" [ref=e531]:
                - cell "Vijay Iyer" [ref=e532]
                - cell "vijay.iyer.133@gmail.com" [ref=e533]
                - cell "PARENT" [ref=e534]
                - cell "—" [ref=e535]
                - cell "Active" [ref=e536]
              - row "Yash Iyer yash.iyer.133@dpsbangalore.edu.in STUDENT — Active" [ref=e537]:
                - cell "Yash Iyer" [ref=e538]
                - cell "yash.iyer.133@dpsbangalore.edu.in" [ref=e539]
                - cell "STUDENT" [ref=e540]
                - cell "—" [ref=e541]
                - cell "Active" [ref=e542]
              - row "Vinod Das vinod.das.132@gmail.com PARENT — Active" [ref=e543]:
                - cell "Vinod Das" [ref=e544]
                - cell "vinod.das.132@gmail.com" [ref=e545]
                - cell "PARENT" [ref=e546]
                - cell "—" [ref=e547]
                - cell "Active" [ref=e548]
              - row "Zara Das zara.das.132@dpsbangalore.edu.in STUDENT — Active" [ref=e549]:
                - cell "Zara Das" [ref=e550]
                - cell "zara.das.132@dpsbangalore.edu.in" [ref=e551]
                - cell "STUDENT" [ref=e552]
                - cell "—" [ref=e553]
                - cell "Active" [ref=e554]
              - row "Manoj Rao manoj.rao.131@gmail.com PARENT — Active" [ref=e555]:
                - cell "Manoj Rao" [ref=e556]
                - cell "manoj.rao.131@gmail.com" [ref=e557]
                - cell "PARENT" [ref=e558]
                - cell "—" [ref=e559]
                - cell "Active" [ref=e560]
              - row "Vanya Rao vanya.rao.131@dpsbangalore.edu.in STUDENT — Active" [ref=e561]:
                - cell "Vanya Rao" [ref=e562]
                - cell "vanya.rao.131@dpsbangalore.edu.in" [ref=e563]
                - cell "STUDENT" [ref=e564]
                - cell "—" [ref=e565]
                - cell "Active" [ref=e566]
              - row "Rajesh Nair rajesh.nair.130@gmail.com PARENT — Active" [ref=e567]:
                - cell "Rajesh Nair" [ref=e568]
                - cell "rajesh.nair.130@gmail.com" [ref=e569]
                - cell "PARENT" [ref=e570]
                - cell "—" [ref=e571]
                - cell "Active" [ref=e572]
              - row "Pari Nair pari.nair.130@dpsbangalore.edu.in STUDENT — Active" [ref=e573]:
                - cell "Pari Nair" [ref=e574]
                - cell "pari.nair.130@dpsbangalore.edu.in" [ref=e575]
                - cell "STUDENT" [ref=e576]
                - cell "—" [ref=e577]
                - cell "Active" [ref=e578]
              - row "Sanjay Kumar sanjay.kumar.129@gmail.com PARENT — Active" [ref=e579]:
                - cell "Sanjay Kumar" [ref=e580]
                - cell "sanjay.kumar.129@gmail.com" [ref=e581]
                - cell "PARENT" [ref=e582]
                - cell "—" [ref=e583]
                - cell "Active" [ref=e584]
              - row "Ayaan Kumar ayaan.kumar.129@dpsbangalore.edu.in STUDENT — Active" [ref=e585]:
                - cell "Ayaan Kumar" [ref=e586]
                - cell "ayaan.kumar.129@dpsbangalore.edu.in" [ref=e587]
                - cell "STUDENT" [ref=e588]
                - cell "—" [ref=e589]
                - cell "Active" [ref=e590]
              - row "Sanjay Joshi sanjay.joshi.128@gmail.com PARENT — Active" [ref=e591]:
                - cell "Sanjay Joshi" [ref=e592]
                - cell "sanjay.joshi.128@gmail.com" [ref=e593]
                - cell "PARENT" [ref=e594]
                - cell "—" [ref=e595]
                - cell "Active" [ref=e596]
              - row "Karthik Joshi karthik.joshi.128@dpsbangalore.edu.in STUDENT — Active" [ref=e597]:
                - cell "Karthik Joshi" [ref=e598]
                - cell "karthik.joshi.128@dpsbangalore.edu.in" [ref=e599]
                - cell "STUDENT" [ref=e600]
                - cell "—" [ref=e601]
                - cell "Active" [ref=e602]
              - row "Deepak Banerjee deepak.banerjee.127@gmail.com PARENT — Active" [ref=e603]:
                - cell "Deepak Banerjee" [ref=e604]
                - cell "deepak.banerjee.127@gmail.com" [ref=e605]
                - cell "PARENT" [ref=e606]
                - cell "—" [ref=e607]
                - cell "Active" [ref=e608]
              - row "Bhavya Banerjee bhavya.banerjee.127@dpsbangalore.edu.in STUDENT — Active" [ref=e609]:
                - cell "Bhavya Banerjee" [ref=e610]
                - cell "bhavya.banerjee.127@dpsbangalore.edu.in" [ref=e611]
                - cell "STUDENT" [ref=e612]
                - cell "—" [ref=e613]
                - cell "Active" [ref=e614]
              - row "Ramesh Singh ramesh.singh.126@gmail.com PARENT — Active" [ref=e615]:
                - cell "Ramesh Singh" [ref=e616]
                - cell "ramesh.singh.126@gmail.com" [ref=e617]
                - cell "PARENT" [ref=e618]
                - cell "—" [ref=e619]
                - cell "Active" [ref=e620]
              - row "Ira Singh ira.singh.126@dpsbangalore.edu.in STUDENT — Active" [ref=e621]:
                - cell "Ira Singh" [ref=e622]
                - cell "ira.singh.126@dpsbangalore.edu.in" [ref=e623]
                - cell "STUDENT" [ref=e624]
                - cell "—" [ref=e625]
                - cell "Active" [ref=e626]
              - row "Mahesh Pillai mahesh.pillai.125@gmail.com PARENT — Active" [ref=e627]:
                - cell "Mahesh Pillai" [ref=e628]
                - cell "mahesh.pillai.125@gmail.com" [ref=e629]
                - cell "PARENT" [ref=e630]
                - cell "—" [ref=e631]
                - cell "Active" [ref=e632]
              - row "Aditya Pillai aditya.pillai.125@dpsbangalore.edu.in STUDENT — Active" [ref=e633]:
                - cell "Aditya Pillai" [ref=e634]
                - cell "aditya.pillai.125@dpsbangalore.edu.in" [ref=e635]
                - cell "STUDENT" [ref=e636]
                - cell "—" [ref=e637]
                - cell "Active" [ref=e638]
              - row "Naveen Mehta naveen.mehta.124@gmail.com PARENT — Active" [ref=e639]:
                - cell "Naveen Mehta" [ref=e640]
                - cell "naveen.mehta.124@gmail.com" [ref=e641]
                - cell "PARENT" [ref=e642]
                - cell "—" [ref=e643]
                - cell "Active" [ref=e644]
              - row "Karthik Mehta karthik.mehta.124@dpsbangalore.edu.in STUDENT — Active" [ref=e645]:
                - cell "Karthik Mehta" [ref=e646]
                - cell "karthik.mehta.124@dpsbangalore.edu.in" [ref=e647]
                - cell "STUDENT" [ref=e648]
                - cell "—" [ref=e649]
                - cell "Active" [ref=e650]
              - row "Deepak Kulkarni deepak.kulkarni.123@gmail.com PARENT — Active" [ref=e651]:
                - cell "Deepak Kulkarni" [ref=e652]
                - cell "deepak.kulkarni.123@gmail.com" [ref=e653]
                - cell "PARENT" [ref=e654]
                - cell "—" [ref=e655]
                - cell "Active" [ref=e656]
              - row "Riya Kulkarni riya.kulkarni.123@dpsbangalore.edu.in STUDENT — Active" [ref=e657]:
                - cell "Riya Kulkarni" [ref=e658]
                - cell "riya.kulkarni.123@dpsbangalore.edu.in" [ref=e659]
                - cell "STUDENT" [ref=e660]
                - cell "—" [ref=e661]
                - cell "Active" [ref=e662]
              - row "Mahesh Iyer mahesh.iyer.122@gmail.com PARENT — Active" [ref=e663]:
                - cell "Mahesh Iyer" [ref=e664]
                - cell "mahesh.iyer.122@gmail.com" [ref=e665]
                - cell "PARENT" [ref=e666]
                - cell "—" [ref=e667]
                - cell "Active" [ref=e668]
              - row "Aditya Iyer aditya.iyer.122@dpsbangalore.edu.in STUDENT — Active" [ref=e669]:
                - cell "Aditya Iyer" [ref=e670]
                - cell "aditya.iyer.122@dpsbangalore.edu.in" [ref=e671]
                - cell "STUDENT" [ref=e672]
                - cell "—" [ref=e673]
                - cell "Active" [ref=e674]
              - row "Sanjay Reddy sanjay.reddy.121@gmail.com PARENT — Active" [ref=e675]:
                - cell "Sanjay Reddy" [ref=e676]
                - cell "sanjay.reddy.121@gmail.com" [ref=e677]
                - cell "PARENT" [ref=e678]
                - cell "—" [ref=e679]
                - cell "Active" [ref=e680]
              - row "Vihaan Reddy vihaan.reddy.121@dpsbangalore.edu.in STUDENT — Active" [ref=e681]:
                - cell "Vihaan Reddy" [ref=e682]
                - cell "vihaan.reddy.121@dpsbangalore.edu.in" [ref=e683]
                - cell "STUDENT" [ref=e684]
                - cell "—" [ref=e685]
                - cell "Active" [ref=e686]
              - row "Rajesh Menon rajesh.menon.120@gmail.com PARENT — Active" [ref=e687]:
                - cell "Rajesh Menon" [ref=e688]
                - cell "rajesh.menon.120@gmail.com" [ref=e689]
                - cell "PARENT" [ref=e690]
                - cell "—" [ref=e691]
                - cell "Active" [ref=e692]
              - row "Ayaan Menon ayaan.menon.120@dpsbangalore.edu.in STUDENT — Active" [ref=e693]:
                - cell "Ayaan Menon" [ref=e694]
                - cell "ayaan.menon.120@dpsbangalore.edu.in" [ref=e695]
                - cell "STUDENT" [ref=e696]
                - cell "—" [ref=e697]
                - cell "Active" [ref=e698]
              - row "Pradeep Saxena pradeep.saxena.119@gmail.com PARENT — Active" [ref=e699]:
                - cell "Pradeep Saxena" [ref=e700]
                - cell "pradeep.saxena.119@gmail.com" [ref=e701]
                - cell "PARENT" [ref=e702]
                - cell "—" [ref=e703]
                - cell "Active" [ref=e704]
              - row "Navya Saxena navya.saxena.119@dpsbangalore.edu.in STUDENT — Active" [ref=e705]:
                - cell "Navya Saxena" [ref=e706]
                - cell "navya.saxena.119@dpsbangalore.edu.in" [ref=e707]
                - cell "STUDENT" [ref=e708]
                - cell "—" [ref=e709]
                - cell "Active" [ref=e710]
              - row "Ashok Saxena ashok.saxena.118@gmail.com PARENT — Active" [ref=e711]:
                - cell "Ashok Saxena" [ref=e712]
                - cell "ashok.saxena.118@gmail.com" [ref=e713]
                - cell "PARENT" [ref=e714]
                - cell "—" [ref=e715]
                - cell "Active" [ref=e716]
              - row "Tanvi Saxena tanvi.saxena.118@dpsbangalore.edu.in STUDENT — Active" [ref=e717]:
                - cell "Tanvi Saxena" [ref=e718]
                - cell "tanvi.saxena.118@dpsbangalore.edu.in" [ref=e719]
                - cell "STUDENT" [ref=e720]
                - cell "—" [ref=e721]
                - cell "Active" [ref=e722]
              - row "Pradeep Sharma pradeep.sharma.117@gmail.com PARENT — Active" [ref=e723]:
                - cell "Pradeep Sharma" [ref=e724]
                - cell "pradeep.sharma.117@gmail.com" [ref=e725]
                - cell "PARENT" [ref=e726]
                - cell "—" [ref=e727]
                - cell "Active" [ref=e728]
              - row "Pari Sharma pari.sharma.117@dpsbangalore.edu.in STUDENT — Active" [ref=e729]:
                - cell "Pari Sharma" [ref=e730]
                - cell "pari.sharma.117@dpsbangalore.edu.in" [ref=e731]
                - cell "STUDENT" [ref=e732]
                - cell "—" [ref=e733]
                - cell "Active" [ref=e734]
              - row "Sandeep Reddy sandeep.reddy.116@gmail.com PARENT — Active" [ref=e735]:
                - cell "Sandeep Reddy" [ref=e736]
                - cell "sandeep.reddy.116@gmail.com" [ref=e737]
                - cell "PARENT" [ref=e738]
                - cell "—" [ref=e739]
                - cell "Active" [ref=e740]
              - row "Anvi Reddy anvi.reddy.116@dpsbangalore.edu.in STUDENT — Active" [ref=e741]:
                - cell "Anvi Reddy" [ref=e742]
                - cell "anvi.reddy.116@dpsbangalore.edu.in" [ref=e743]
                - cell "STUDENT" [ref=e744]
                - cell "—" [ref=e745]
                - cell "Active" [ref=e746]
              - row "Manoj Banerjee manoj.banerjee.115@gmail.com PARENT — Active" [ref=e747]:
                - cell "Manoj Banerjee" [ref=e748]
                - cell "manoj.banerjee.115@gmail.com" [ref=e749]
                - cell "PARENT" [ref=e750]
                - cell "—" [ref=e751]
                - cell "Active" [ref=e752]
              - row "Rishi Banerjee rishi.banerjee.115@dpsbangalore.edu.in STUDENT — Active" [ref=e753]:
                - cell "Rishi Banerjee" [ref=e754]
                - cell "rishi.banerjee.115@dpsbangalore.edu.in" [ref=e755]
                - cell "STUDENT" [ref=e756]
                - cell "—" [ref=e757]
                - cell "Active" [ref=e758]
              - row "Ashok Nair ashok.nair.114@gmail.com PARENT — Active" [ref=e759]:
                - cell "Ashok Nair" [ref=e760]
                - cell "ashok.nair.114@gmail.com" [ref=e761]
                - cell "PARENT" [ref=e762]
                - cell "—" [ref=e763]
                - cell "Active" [ref=e764]
              - row "Yash Nair yash.nair.114@dpsbangalore.edu.in STUDENT — Active" [ref=e765]:
                - cell "Yash Nair" [ref=e766]
                - cell "yash.nair.114@dpsbangalore.edu.in" [ref=e767]
                - cell "STUDENT" [ref=e768]
                - cell "—" [ref=e769]
                - cell "Active" [ref=e770]
              - row "Praveen Das praveen.das.113@gmail.com PARENT — Active" [ref=e771]:
                - cell "Praveen Das" [ref=e772]
                - cell "praveen.das.113@gmail.com" [ref=e773]
                - cell "PARENT" [ref=e774]
                - cell "—" [ref=e775]
                - cell "Active" [ref=e776]
              - row "Zara Das zara.das.113@dpsbangalore.edu.in STUDENT — Active" [ref=e777]:
                - cell "Zara Das" [ref=e778]
                - cell "zara.das.113@dpsbangalore.edu.in" [ref=e779]
                - cell "STUDENT" [ref=e780]
                - cell "—" [ref=e781]
                - cell "Active" [ref=e782]
  - region "Notifications alt+T"
  - alert [ref=e783]
```

# Test source

```ts
  1   | // TC-700.* — edge inputs, error states, slow networks, refresh mid-flow,
  2   | // browser back/forward, session expiry behavior.
  3   | import { test, expect } from "@playwright/test";
  4   | import { BASE, ROLE_CREDS, signInAsRole, signIn } from "./_helpers";
  5   | 
  6   | test.describe("Form edge cases", () => {
  7   |   test("TC-700 invite with emoji in name accepted and rendered", async ({ page }) => {
  8   |     await signInAsRole(page, "ADMIN");
  9   |     await page.goto(BASE + "/Settings/users");
  10  |     const stamp = Date.now();
  11  |     const email = `qa-emoji-${stamp}@vidyalaya-qa.local`;
  12  |     await page.getByLabel(/full name/i).fill("Aananya 😀 Iyer");
  13  |     await page.getByLabel(/^email$/i).fill(email);
> 14  |     await page.getByLabel(/^role$/i).selectOption("TEACHER");
      |                                      ^ Error: locator.selectOption: Test timeout of 20000ms exceeded.
  15  |     await page.getByRole("button", { name: /send invitation/i }).click();
  16  |     await expect(page.getByText(/invitation sent/i)).toBeVisible();
  17  |     // Reload — emoji should appear in the pending list
  18  |     await page.reload();
  19  |     await expect(page.getByText(/Aananya.*Iyer/)).toBeVisible();
  20  |   });
  21  | 
  22  |   test("TC-701 invite with very long name (>200 chars)", async ({ page }) => {
  23  |     await signInAsRole(page, "ADMIN");
  24  |     await page.goto(BASE + "/Settings/users");
  25  |     await page.getByLabel(/full name/i).fill("A".repeat(220));
  26  |     await page.getByLabel(/^email$/i).fill(`qa-long-${Date.now()}@vidyalaya-qa.local`);
  27  |     await page.getByRole("button", { name: /send invitation/i }).click();
  28  |     // Should EITHER accept (no max enforced) OR show a validation error.
  29  |     // It should NOT 500.
  30  |     await page.waitForLoadState("networkidle");
  31  |     const errorBanner = page.getByText(/something went wrong/i);
  32  |     await expect(errorBanner).toHaveCount(0);
  33  |   });
  34  | 
  35  |   test("TC-702 email field rejects header injection (newlines)", async ({ page }) => {
  36  |     await signInAsRole(page, "ADMIN");
  37  |     await page.goto(BASE + "/Settings/users");
  38  |     await page.getByLabel(/full name/i).fill("X");
  39  |     await page.getByLabel(/^email$/i).fill("foo@bar.com\nBcc: evil@example.com");
  40  |     await page.getByRole("button", { name: /send invitation/i }).click();
  41  |     // Either client-side input validation strips newlines, or server returns invalid-email
  42  |     const sent = page.getByText(/invitation sent/i);
  43  |     const rejected = page.getByText(/valid email/i);
  44  |     await expect(sent.or(rejected)).toBeVisible();
  45  |   });
  46  | });
  47  | 
  48  | test.describe("Browser navigation", () => {
  49  |   test("TC-710 back/forward works after login", async ({ page }) => {
  50  |     await signInAsRole(page, "ADMIN");
  51  |     await page.goto(BASE + "/classes");
  52  |     await page.goto(BASE + "/announcements");
  53  |     await page.goBack();
  54  |     await expect(page).toHaveURL(/\/classes$/);
  55  |     await page.goForward();
  56  |     await expect(page).toHaveURL(/\/announcements$/);
  57  |   });
  58  | 
  59  |   test("TC-711 refresh on a signed-in page keeps session", async ({ page }) => {
  60  |     await signInAsRole(page, "ADMIN");
  61  |     await page.goto(BASE + "/classes");
  62  |     await page.reload();
  63  |     await expect(page).toHaveURL(/\/classes/);
  64  |     await expect(page.getByRole("link", { name: /audit log/i })).toBeVisible();
  65  |   });
  66  | 
  67  |   test("TC-712 cleared cookies → next request bounces to login", async ({ page, context }) => {
  68  |     await signInAsRole(page, "ADMIN");
  69  |     await context.clearCookies();
  70  |     await page.goto(BASE + "/audit");
  71  |     await expect(page).toHaveURL(/\/login/);
  72  |   });
  73  | });
  74  | 
  75  | test.describe("Network resilience", () => {
  76  |   test("TC-720 forgot-password under simulated slow network", async ({ page }) => {
  77  |     // Slow down all requests to the API
  78  |     await page.route("**/api/auth/forgot", async (route) => {
  79  |       await new Promise((r) => setTimeout(r, 2000));
  80  |       await route.continue();
  81  |     });
  82  |     await page.goto(BASE + "/forgot-password");
  83  |     await page.getByLabel(/email/i).fill("nobody@example.com");
  84  |     const btn = page.getByRole("button", { name: /send reset link/i });
  85  |     await btn.click();
  86  |     // Should show some loading indication then settle on the confirmation
  87  |     await expect(page.getByText(/if an account exists/i)).toBeVisible({ timeout: 10000 });
  88  |   });
  89  | 
  90  |   test("TC-721 forgot-password resilience to API 500", async ({ page }) => {
  91  |     await page.route("**/api/auth/forgot", (route) =>
  92  |       route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"oops"}' })
  93  |     );
  94  |     await page.goto(BASE + "/forgot-password");
  95  |     await page.getByLabel(/email/i).fill("nobody@example.com");
  96  |     await page.getByRole("button", { name: /send reset link/i }).click();
  97  |     // Should not crash; should still show a confirmation (fire-and-forget UX) or graceful failure
  98  |     await page.waitForLoadState("networkidle");
  99  |     const errorBanner = page.getByText(/something went wrong/i);
  100 |     await expect(errorBanner).toHaveCount(0);
  101 |   });
  102 | });
  103 | 
  104 | test.describe("Empty / loading states", () => {
  105 |   test("TC-730 /audit shows table or empty-state when no rows", async ({ page }) => {
  106 |     await signInAsRole(page, "ADMIN");
  107 |     await page.goto(BASE + "/audit");
  108 |     // Either there are rows or an empty-state message — page should not be visually broken
  109 |     await page.waitForLoadState("networkidle");
  110 |     await expect(page.locator("body")).toContainText(/audit|action|entity|empty|no/i);
  111 |   });
  112 | 
  113 |   test("TC-731 /messages outbox renders without crashing", async ({ page }) => {
  114 |     await signInAsRole(page, "ADMIN");
```