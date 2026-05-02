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
                  - text: qa-emoji-1777731924144@vidyalaya-qa.local
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
            - heading "Pending invitations (2)" [level=2] [ref=e168]
            - list [ref=e169]:
              - listitem [ref=e170]:
                - generic [ref=e171]:
                  - generic [ref=e172]: <script>window.__pwn=true</script>Hacker · qa-xss-1777731913561@vidyalaya-qa.local
                  - generic [ref=e173]: TEACHER · expires 5/9/2026
              - listitem [ref=e174]:
                - generic [ref=e175]:
                  - generic [ref=e176]: <script>window.__pwn=true</script>Hacker · qa-xss-1777731906077@vidyalaya-qa.local
                  - generic [ref=e177]: TEACHER · expires 5/9/2026
        - generic [ref=e178]:
          - heading "Members (100)" [level=2] [ref=e179]
          - table [ref=e181]:
            - rowgroup [ref=e182]:
              - row "Name Email Role Last login Status" [ref=e183]:
                - columnheader "Name" [ref=e184]
                - columnheader "Email" [ref=e185]
                - columnheader "Role" [ref=e186]
                - columnheader "Last login" [ref=e187]
                - columnheader "Status" [ref=e188]
            - rowgroup [ref=e189]:
              - row "Suresh Gupta suresh.gupta.162@gmail.com PARENT — Active" [ref=e190]:
                - cell "Suresh Gupta" [ref=e191]
                - cell "suresh.gupta.162@gmail.com" [ref=e192]
                - cell "PARENT" [ref=e193]
                - cell "—" [ref=e194]
                - cell "Active" [ref=e195]
              - row "Sara Gupta sara.gupta.162@dpsbangalore.edu.in STUDENT — Active" [ref=e196]:
                - cell "Sara Gupta" [ref=e197]
                - cell "sara.gupta.162@dpsbangalore.edu.in" [ref=e198]
                - cell "STUDENT" [ref=e199]
                - cell "—" [ref=e200]
                - cell "Active" [ref=e201]
              - row "Pradeep Banerjee pradeep.banerjee.161@gmail.com PARENT — Active" [ref=e202]:
                - cell "Pradeep Banerjee" [ref=e203]
                - cell "pradeep.banerjee.161@gmail.com" [ref=e204]
                - cell "PARENT" [ref=e205]
                - cell "—" [ref=e206]
                - cell "Active" [ref=e207]
              - row "Neel Banerjee neel.banerjee.161@dpsbangalore.edu.in STUDENT — Active" [ref=e208]:
                - cell "Neel Banerjee" [ref=e209]
                - cell "neel.banerjee.161@dpsbangalore.edu.in" [ref=e210]
                - cell "STUDENT" [ref=e211]
                - cell "—" [ref=e212]
                - cell "Active" [ref=e213]
              - row "Manoj Khanna manoj.khanna.160@gmail.com PARENT — Active" [ref=e214]:
                - cell "Manoj Khanna" [ref=e215]
                - cell "manoj.khanna.160@gmail.com" [ref=e216]
                - cell "PARENT" [ref=e217]
                - cell "—" [ref=e218]
                - cell "Active" [ref=e219]
              - row "Krishna Khanna krishna.khanna.160@dpsbangalore.edu.in STUDENT — Active" [ref=e220]:
                - cell "Krishna Khanna" [ref=e221]
                - cell "krishna.khanna.160@dpsbangalore.edu.in" [ref=e222]
                - cell "STUDENT" [ref=e223]
                - cell "—" [ref=e224]
                - cell "Active" [ref=e225]
              - row "Praveen Khanna praveen.khanna.159@gmail.com PARENT — Active" [ref=e226]:
                - cell "Praveen Khanna" [ref=e227]
                - cell "praveen.khanna.159@gmail.com" [ref=e228]
                - cell "PARENT" [ref=e229]
                - cell "—" [ref=e230]
                - cell "Active" [ref=e231]
              - row "Rohan Khanna rohan.khanna.159@dpsbangalore.edu.in STUDENT — Active" [ref=e232]:
                - cell "Rohan Khanna" [ref=e233]
                - cell "rohan.khanna.159@dpsbangalore.edu.in" [ref=e234]
                - cell "STUDENT" [ref=e235]
                - cell "—" [ref=e236]
                - cell "Active" [ref=e237]
              - row "Suresh Kulkarni suresh.kulkarni.158@gmail.com PARENT — Active" [ref=e238]:
                - cell "Suresh Kulkarni" [ref=e239]
                - cell "suresh.kulkarni.158@gmail.com" [ref=e240]
                - cell "PARENT" [ref=e241]
                - cell "—" [ref=e242]
                - cell "Active" [ref=e243]
              - row "Rishi Kulkarni rishi.kulkarni.158@dpsbangalore.edu.in STUDENT — Active" [ref=e244]:
                - cell "Rishi Kulkarni" [ref=e245]
                - cell "rishi.kulkarni.158@dpsbangalore.edu.in" [ref=e246]
                - cell "STUDENT" [ref=e247]
                - cell "—" [ref=e248]
                - cell "Active" [ref=e249]
              - row "Ashok Kumar ashok.kumar.157@gmail.com PARENT — Active" [ref=e250]:
                - cell "Ashok Kumar" [ref=e251]
                - cell "ashok.kumar.157@gmail.com" [ref=e252]
                - cell "PARENT" [ref=e253]
                - cell "—" [ref=e254]
                - cell "Active" [ref=e255]
              - row "Yash Kumar yash.kumar.157@dpsbangalore.edu.in STUDENT — Active" [ref=e256]:
                - cell "Yash Kumar" [ref=e257]
                - cell "yash.kumar.157@dpsbangalore.edu.in" [ref=e258]
                - cell "STUDENT" [ref=e259]
                - cell "—" [ref=e260]
                - cell "Active" [ref=e261]
              - row "Mahesh Saxena mahesh.saxena.156@gmail.com PARENT — Active" [ref=e262]:
                - cell "Mahesh Saxena" [ref=e263]
                - cell "mahesh.saxena.156@gmail.com" [ref=e264]
                - cell "PARENT" [ref=e265]
                - cell "—" [ref=e266]
                - cell "Active" [ref=e267]
              - row "Krishna Saxena krishna.saxena.156@dpsbangalore.edu.in STUDENT — Active" [ref=e268]:
                - cell "Krishna Saxena" [ref=e269]
                - cell "krishna.saxena.156@dpsbangalore.edu.in" [ref=e270]
                - cell "STUDENT" [ref=e271]
                - cell "—" [ref=e272]
                - cell "Active" [ref=e273]
              - row "Naveen Gupta naveen.gupta.155@gmail.com PARENT — Active" [ref=e274]:
                - cell "Naveen Gupta" [ref=e275]
                - cell "naveen.gupta.155@gmail.com" [ref=e276]
                - cell "PARENT" [ref=e277]
                - cell "—" [ref=e278]
                - cell "Active" [ref=e279]
              - row "Vanya Gupta vanya.gupta.155@dpsbangalore.edu.in STUDENT — Active" [ref=e280]:
                - cell "Vanya Gupta" [ref=e281]
                - cell "vanya.gupta.155@dpsbangalore.edu.in" [ref=e282]
                - cell "STUDENT" [ref=e283]
                - cell "—" [ref=e284]
                - cell "Active" [ref=e285]
              - row "Sanjay Patel sanjay.patel.154@gmail.com PARENT — Active" [ref=e286]:
                - cell "Sanjay Patel" [ref=e287]
                - cell "sanjay.patel.154@gmail.com" [ref=e288]
                - cell "PARENT" [ref=e289]
                - cell "—" [ref=e290]
                - cell "Active" [ref=e291]
              - row "Ayaan Patel ayaan.patel.154@dpsbangalore.edu.in STUDENT — Active" [ref=e292]:
                - cell "Ayaan Patel" [ref=e293]
                - cell "ayaan.patel.154@dpsbangalore.edu.in" [ref=e294]
                - cell "STUDENT" [ref=e295]
                - cell "—" [ref=e296]
                - cell "Active" [ref=e297]
              - row "Pradeep Das pradeep.das.153@gmail.com PARENT — Active" [ref=e298]:
                - cell "Pradeep Das" [ref=e299]
                - cell "pradeep.das.153@gmail.com" [ref=e300]
                - cell "PARENT" [ref=e301]
                - cell "—" [ref=e302]
                - cell "Active" [ref=e303]
              - row "Shaurya Das shaurya.das.153@dpsbangalore.edu.in STUDENT — Active" [ref=e304]:
                - cell "Shaurya Das" [ref=e305]
                - cell "shaurya.das.153@dpsbangalore.edu.in" [ref=e306]
                - cell "STUDENT" [ref=e307]
                - cell "—" [ref=e308]
                - cell "Active" [ref=e309]
              - row "Sanjay Gupta sanjay.gupta.152@gmail.com PARENT — Active" [ref=e310]:
                - cell "Sanjay Gupta" [ref=e311]
                - cell "sanjay.gupta.152@gmail.com" [ref=e312]
                - cell "PARENT" [ref=e313]
                - cell "—" [ref=e314]
                - cell "Active" [ref=e315]
              - row "Yash Gupta yash.gupta.152@dpsbangalore.edu.in STUDENT — Active" [ref=e316]:
                - cell "Yash Gupta" [ref=e317]
                - cell "yash.gupta.152@dpsbangalore.edu.in" [ref=e318]
                - cell "STUDENT" [ref=e319]
                - cell "—" [ref=e320]
                - cell "Active" [ref=e321]
              - row "Pradeep Shetty pradeep.shetty.151@gmail.com PARENT — Active" [ref=e322]:
                - cell "Pradeep Shetty" [ref=e323]
                - cell "pradeep.shetty.151@gmail.com" [ref=e324]
                - cell "PARENT" [ref=e325]
                - cell "—" [ref=e326]
                - cell "Active" [ref=e327]
              - row "Mahi Shetty mahi.shetty.151@dpsbangalore.edu.in STUDENT — Active" [ref=e328]:
                - cell "Mahi Shetty" [ref=e329]
                - cell "mahi.shetty.151@dpsbangalore.edu.in" [ref=e330]
                - cell "STUDENT" [ref=e331]
                - cell "—" [ref=e332]
                - cell "Active" [ref=e333]
              - row "Mahesh Kulkarni mahesh.kulkarni.150@gmail.com PARENT — Active" [ref=e334]:
                - cell "Mahesh Kulkarni" [ref=e335]
                - cell "mahesh.kulkarni.150@gmail.com" [ref=e336]
                - cell "PARENT" [ref=e337]
                - cell "—" [ref=e338]
                - cell "Active" [ref=e339]
              - row "Manav Kulkarni manav.kulkarni.150@dpsbangalore.edu.in STUDENT — Active" [ref=e340]:
                - cell "Manav Kulkarni" [ref=e341]
                - cell "manav.kulkarni.150@dpsbangalore.edu.in" [ref=e342]
                - cell "STUDENT" [ref=e343]
                - cell "—" [ref=e344]
                - cell "Active" [ref=e345]
              - row "Mahesh Das mahesh.das.149@gmail.com PARENT — Active" [ref=e346]:
                - cell "Mahesh Das" [ref=e347]
                - cell "mahesh.das.149@gmail.com" [ref=e348]
                - cell "PARENT" [ref=e349]
                - cell "—" [ref=e350]
                - cell "Active" [ref=e351]
              - row "Aarav Das aarav.das.149@dpsbangalore.edu.in STUDENT — Active" [ref=e352]:
                - cell "Aarav Das" [ref=e353]
                - cell "aarav.das.149@dpsbangalore.edu.in" [ref=e354]
                - cell "STUDENT" [ref=e355]
                - cell "—" [ref=e356]
                - cell "Active" [ref=e357]
              - row "Vinod Kumar vinod.kumar.148@gmail.com PARENT — Active" [ref=e358]:
                - cell "Vinod Kumar" [ref=e359]
                - cell "vinod.kumar.148@gmail.com" [ref=e360]
                - cell "PARENT" [ref=e361]
                - cell "—" [ref=e362]
                - cell "Active" [ref=e363]
              - row "Kabir Kumar kabir.kumar.148@dpsbangalore.edu.in STUDENT — Active" [ref=e364]:
                - cell "Kabir Kumar" [ref=e365]
                - cell "kabir.kumar.148@dpsbangalore.edu.in" [ref=e366]
                - cell "STUDENT" [ref=e367]
                - cell "—" [ref=e368]
                - cell "Active" [ref=e369]
              - row "Manoj Banerjee manoj.banerjee.147@gmail.com PARENT — Active" [ref=e370]:
                - cell "Manoj Banerjee" [ref=e371]
                - cell "manoj.banerjee.147@gmail.com" [ref=e372]
                - cell "PARENT" [ref=e373]
                - cell "—" [ref=e374]
                - cell "Active" [ref=e375]
              - row "Prisha Banerjee prisha.banerjee.147@dpsbangalore.edu.in STUDENT — Active" [ref=e376]:
                - cell "Prisha Banerjee" [ref=e377]
                - cell "prisha.banerjee.147@dpsbangalore.edu.in" [ref=e378]
                - cell "STUDENT" [ref=e379]
                - cell "—" [ref=e380]
                - cell "Active" [ref=e381]
              - row "Mahesh Singh mahesh.singh.146@gmail.com PARENT — Active" [ref=e382]:
                - cell "Mahesh Singh" [ref=e383]
                - cell "mahesh.singh.146@gmail.com" [ref=e384]
                - cell "PARENT" [ref=e385]
                - cell "—" [ref=e386]
                - cell "Active" [ref=e387]
              - row "Ayaan Singh ayaan.singh.146@dpsbangalore.edu.in STUDENT — Active" [ref=e388]:
                - cell "Ayaan Singh" [ref=e389]
                - cell "ayaan.singh.146@dpsbangalore.edu.in" [ref=e390]
                - cell "STUDENT" [ref=e391]
                - cell "—" [ref=e392]
                - cell "Active" [ref=e393]
              - row "Vinod Kumar vinod.kumar.145@gmail.com PARENT — Active" [ref=e394]:
                - cell "Vinod Kumar" [ref=e395]
                - cell "vinod.kumar.145@gmail.com" [ref=e396]
                - cell "PARENT" [ref=e397]
                - cell "—" [ref=e398]
                - cell "Active" [ref=e399]
              - row "Vanya Kumar vanya.kumar.145@dpsbangalore.edu.in STUDENT — Active" [ref=e400]:
                - cell "Vanya Kumar" [ref=e401]
                - cell "vanya.kumar.145@dpsbangalore.edu.in" [ref=e402]
                - cell "STUDENT" [ref=e403]
                - cell "—" [ref=e404]
                - cell "Active" [ref=e405]
              - row "Vijay Das vijay.das.144@gmail.com PARENT — Active" [ref=e406]:
                - cell "Vijay Das" [ref=e407]
                - cell "vijay.das.144@gmail.com" [ref=e408]
                - cell "PARENT" [ref=e409]
                - cell "—" [ref=e410]
                - cell "Active" [ref=e411]
              - row "Zara Das zara.das.144@dpsbangalore.edu.in STUDENT — Active" [ref=e412]:
                - cell "Zara Das" [ref=e413]
                - cell "zara.das.144@dpsbangalore.edu.in" [ref=e414]
                - cell "STUDENT" [ref=e415]
                - cell "—" [ref=e416]
                - cell "Active" [ref=e417]
              - row "Rajesh Kumar rajesh.kumar.143@gmail.com PARENT — Active" [ref=e418]:
                - cell "Rajesh Kumar" [ref=e419]
                - cell "rajesh.kumar.143@gmail.com" [ref=e420]
                - cell "PARENT" [ref=e421]
                - cell "—" [ref=e422]
                - cell "Active" [ref=e423]
              - row "Shaurya Kumar shaurya.kumar.143@dpsbangalore.edu.in STUDENT — Active" [ref=e424]:
                - cell "Shaurya Kumar" [ref=e425]
                - cell "shaurya.kumar.143@dpsbangalore.edu.in" [ref=e426]
                - cell "STUDENT" [ref=e427]
                - cell "—" [ref=e428]
                - cell "Active" [ref=e429]
              - row "Mahesh Gupta mahesh.gupta.142@gmail.com PARENT — Active" [ref=e430]:
                - cell "Mahesh Gupta" [ref=e431]
                - cell "mahesh.gupta.142@gmail.com" [ref=e432]
                - cell "PARENT" [ref=e433]
                - cell "—" [ref=e434]
                - cell "Active" [ref=e435]
              - row "Myra Gupta myra.gupta.142@dpsbangalore.edu.in STUDENT — Active" [ref=e436]:
                - cell "Myra Gupta" [ref=e437]
                - cell "myra.gupta.142@dpsbangalore.edu.in" [ref=e438]
                - cell "STUDENT" [ref=e439]
                - cell "—" [ref=e440]
                - cell "Active" [ref=e441]
              - row "Sandeep Kumar sandeep.kumar.141@gmail.com PARENT — Active" [ref=e442]:
                - cell "Sandeep Kumar" [ref=e443]
                - cell "sandeep.kumar.141@gmail.com" [ref=e444]
                - cell "PARENT" [ref=e445]
                - cell "—" [ref=e446]
                - cell "Active" [ref=e447]
              - row "Kiara Kumar kiara.kumar.141@dpsbangalore.edu.in STUDENT — Active" [ref=e448]:
                - cell "Kiara Kumar" [ref=e449]
                - cell "kiara.kumar.141@dpsbangalore.edu.in" [ref=e450]
                - cell "STUDENT" [ref=e451]
                - cell "—" [ref=e452]
                - cell "Active" [ref=e453]
              - row "Vinod Sharma vinod.sharma.140@gmail.com PARENT — Active" [ref=e454]:
                - cell "Vinod Sharma" [ref=e455]
                - cell "vinod.sharma.140@gmail.com" [ref=e456]
                - cell "PARENT" [ref=e457]
                - cell "—" [ref=e458]
                - cell "Active" [ref=e459]
              - row "Zara Sharma zara.sharma.140@dpsbangalore.edu.in STUDENT — Active" [ref=e460]:
                - cell "Zara Sharma" [ref=e461]
                - cell "zara.sharma.140@dpsbangalore.edu.in" [ref=e462]
                - cell "STUDENT" [ref=e463]
                - cell "—" [ref=e464]
                - cell "Active" [ref=e465]
              - row "Manoj Khanna manoj.khanna.139@gmail.com PARENT — Active" [ref=e466]:
                - cell "Manoj Khanna" [ref=e467]
                - cell "manoj.khanna.139@gmail.com" [ref=e468]
                - cell "PARENT" [ref=e469]
                - cell "—" [ref=e470]
                - cell "Active" [ref=e471]
              - row "Shaurya Khanna shaurya.khanna.139@dpsbangalore.edu.in STUDENT — Active" [ref=e472]:
                - cell "Shaurya Khanna" [ref=e473]
                - cell "shaurya.khanna.139@dpsbangalore.edu.in" [ref=e474]
                - cell "STUDENT" [ref=e475]
                - cell "—" [ref=e476]
                - cell "Active" [ref=e477]
              - row "Naveen Banerjee naveen.banerjee.138@gmail.com PARENT — Active" [ref=e478]:
                - cell "Naveen Banerjee" [ref=e479]
                - cell "naveen.banerjee.138@gmail.com" [ref=e480]
                - cell "PARENT" [ref=e481]
                - cell "—" [ref=e482]
                - cell "Active" [ref=e483]
              - row "Shaurya Banerjee shaurya.banerjee.138@dpsbangalore.edu.in STUDENT — Active" [ref=e484]:
                - cell "Shaurya Banerjee" [ref=e485]
                - cell "shaurya.banerjee.138@dpsbangalore.edu.in" [ref=e486]
                - cell "STUDENT" [ref=e487]
                - cell "—" [ref=e488]
                - cell "Active" [ref=e489]
              - row "Sandeep Pillai sandeep.pillai.137@gmail.com PARENT — Active" [ref=e490]:
                - cell "Sandeep Pillai" [ref=e491]
                - cell "sandeep.pillai.137@gmail.com" [ref=e492]
                - cell "PARENT" [ref=e493]
                - cell "—" [ref=e494]
                - cell "Active" [ref=e495]
              - row "Kiara Pillai kiara.pillai.137@dpsbangalore.edu.in STUDENT — Active" [ref=e496]:
                - cell "Kiara Pillai" [ref=e497]
                - cell "kiara.pillai.137@dpsbangalore.edu.in" [ref=e498]
                - cell "STUDENT" [ref=e499]
                - cell "—" [ref=e500]
                - cell "Active" [ref=e501]
              - row "Anil Gupta anil.gupta.136@gmail.com PARENT — Active" [ref=e502]:
                - cell "Anil Gupta" [ref=e503]
                - cell "anil.gupta.136@gmail.com" [ref=e504]
                - cell "PARENT" [ref=e505]
                - cell "—" [ref=e506]
                - cell "Active" [ref=e507]
              - row "Shaurya Gupta shaurya.gupta.136@dpsbangalore.edu.in STUDENT — Active" [ref=e508]:
                - cell "Shaurya Gupta" [ref=e509]
                - cell "shaurya.gupta.136@dpsbangalore.edu.in" [ref=e510]
                - cell "STUDENT" [ref=e511]
                - cell "—" [ref=e512]
                - cell "Active" [ref=e513]
              - row "Rajesh Rao rajesh.rao.135@gmail.com PARENT — Active" [ref=e514]:
                - cell "Rajesh Rao" [ref=e515]
                - cell "rajesh.rao.135@gmail.com" [ref=e516]
                - cell "PARENT" [ref=e517]
                - cell "—" [ref=e518]
                - cell "Active" [ref=e519]
              - row "Arjun Rao arjun.rao.135@dpsbangalore.edu.in STUDENT — Active" [ref=e520]:
                - cell "Arjun Rao" [ref=e521]
                - cell "arjun.rao.135@dpsbangalore.edu.in" [ref=e522]
                - cell "STUDENT" [ref=e523]
                - cell "—" [ref=e524]
                - cell "Active" [ref=e525]
              - row "Ashok Gupta ashok.gupta.134@gmail.com PARENT — Active" [ref=e526]:
                - cell "Ashok Gupta" [ref=e527]
                - cell "ashok.gupta.134@gmail.com" [ref=e528]
                - cell "PARENT" [ref=e529]
                - cell "—" [ref=e530]
                - cell "Active" [ref=e531]
              - row "Yash Gupta yash.gupta.134@dpsbangalore.edu.in STUDENT — Active" [ref=e532]:
                - cell "Yash Gupta" [ref=e533]
                - cell "yash.gupta.134@dpsbangalore.edu.in" [ref=e534]
                - cell "STUDENT" [ref=e535]
                - cell "—" [ref=e536]
                - cell "Active" [ref=e537]
              - row "Vijay Iyer vijay.iyer.133@gmail.com PARENT — Active" [ref=e538]:
                - cell "Vijay Iyer" [ref=e539]
                - cell "vijay.iyer.133@gmail.com" [ref=e540]
                - cell "PARENT" [ref=e541]
                - cell "—" [ref=e542]
                - cell "Active" [ref=e543]
              - row "Yash Iyer yash.iyer.133@dpsbangalore.edu.in STUDENT — Active" [ref=e544]:
                - cell "Yash Iyer" [ref=e545]
                - cell "yash.iyer.133@dpsbangalore.edu.in" [ref=e546]
                - cell "STUDENT" [ref=e547]
                - cell "—" [ref=e548]
                - cell "Active" [ref=e549]
              - row "Vinod Das vinod.das.132@gmail.com PARENT — Active" [ref=e550]:
                - cell "Vinod Das" [ref=e551]
                - cell "vinod.das.132@gmail.com" [ref=e552]
                - cell "PARENT" [ref=e553]
                - cell "—" [ref=e554]
                - cell "Active" [ref=e555]
              - row "Zara Das zara.das.132@dpsbangalore.edu.in STUDENT — Active" [ref=e556]:
                - cell "Zara Das" [ref=e557]
                - cell "zara.das.132@dpsbangalore.edu.in" [ref=e558]
                - cell "STUDENT" [ref=e559]
                - cell "—" [ref=e560]
                - cell "Active" [ref=e561]
              - row "Manoj Rao manoj.rao.131@gmail.com PARENT — Active" [ref=e562]:
                - cell "Manoj Rao" [ref=e563]
                - cell "manoj.rao.131@gmail.com" [ref=e564]
                - cell "PARENT" [ref=e565]
                - cell "—" [ref=e566]
                - cell "Active" [ref=e567]
              - row "Vanya Rao vanya.rao.131@dpsbangalore.edu.in STUDENT — Active" [ref=e568]:
                - cell "Vanya Rao" [ref=e569]
                - cell "vanya.rao.131@dpsbangalore.edu.in" [ref=e570]
                - cell "STUDENT" [ref=e571]
                - cell "—" [ref=e572]
                - cell "Active" [ref=e573]
              - row "Rajesh Nair rajesh.nair.130@gmail.com PARENT — Active" [ref=e574]:
                - cell "Rajesh Nair" [ref=e575]
                - cell "rajesh.nair.130@gmail.com" [ref=e576]
                - cell "PARENT" [ref=e577]
                - cell "—" [ref=e578]
                - cell "Active" [ref=e579]
              - row "Pari Nair pari.nair.130@dpsbangalore.edu.in STUDENT — Active" [ref=e580]:
                - cell "Pari Nair" [ref=e581]
                - cell "pari.nair.130@dpsbangalore.edu.in" [ref=e582]
                - cell "STUDENT" [ref=e583]
                - cell "—" [ref=e584]
                - cell "Active" [ref=e585]
              - row "Sanjay Kumar sanjay.kumar.129@gmail.com PARENT — Active" [ref=e586]:
                - cell "Sanjay Kumar" [ref=e587]
                - cell "sanjay.kumar.129@gmail.com" [ref=e588]
                - cell "PARENT" [ref=e589]
                - cell "—" [ref=e590]
                - cell "Active" [ref=e591]
              - row "Ayaan Kumar ayaan.kumar.129@dpsbangalore.edu.in STUDENT — Active" [ref=e592]:
                - cell "Ayaan Kumar" [ref=e593]
                - cell "ayaan.kumar.129@dpsbangalore.edu.in" [ref=e594]
                - cell "STUDENT" [ref=e595]
                - cell "—" [ref=e596]
                - cell "Active" [ref=e597]
              - row "Sanjay Joshi sanjay.joshi.128@gmail.com PARENT — Active" [ref=e598]:
                - cell "Sanjay Joshi" [ref=e599]
                - cell "sanjay.joshi.128@gmail.com" [ref=e600]
                - cell "PARENT" [ref=e601]
                - cell "—" [ref=e602]
                - cell "Active" [ref=e603]
              - row "Karthik Joshi karthik.joshi.128@dpsbangalore.edu.in STUDENT — Active" [ref=e604]:
                - cell "Karthik Joshi" [ref=e605]
                - cell "karthik.joshi.128@dpsbangalore.edu.in" [ref=e606]
                - cell "STUDENT" [ref=e607]
                - cell "—" [ref=e608]
                - cell "Active" [ref=e609]
              - row "Deepak Banerjee deepak.banerjee.127@gmail.com PARENT — Active" [ref=e610]:
                - cell "Deepak Banerjee" [ref=e611]
                - cell "deepak.banerjee.127@gmail.com" [ref=e612]
                - cell "PARENT" [ref=e613]
                - cell "—" [ref=e614]
                - cell "Active" [ref=e615]
              - row "Bhavya Banerjee bhavya.banerjee.127@dpsbangalore.edu.in STUDENT — Active" [ref=e616]:
                - cell "Bhavya Banerjee" [ref=e617]
                - cell "bhavya.banerjee.127@dpsbangalore.edu.in" [ref=e618]
                - cell "STUDENT" [ref=e619]
                - cell "—" [ref=e620]
                - cell "Active" [ref=e621]
              - row "Ramesh Singh ramesh.singh.126@gmail.com PARENT — Active" [ref=e622]:
                - cell "Ramesh Singh" [ref=e623]
                - cell "ramesh.singh.126@gmail.com" [ref=e624]
                - cell "PARENT" [ref=e625]
                - cell "—" [ref=e626]
                - cell "Active" [ref=e627]
              - row "Ira Singh ira.singh.126@dpsbangalore.edu.in STUDENT — Active" [ref=e628]:
                - cell "Ira Singh" [ref=e629]
                - cell "ira.singh.126@dpsbangalore.edu.in" [ref=e630]
                - cell "STUDENT" [ref=e631]
                - cell "—" [ref=e632]
                - cell "Active" [ref=e633]
              - row "Mahesh Pillai mahesh.pillai.125@gmail.com PARENT — Active" [ref=e634]:
                - cell "Mahesh Pillai" [ref=e635]
                - cell "mahesh.pillai.125@gmail.com" [ref=e636]
                - cell "PARENT" [ref=e637]
                - cell "—" [ref=e638]
                - cell "Active" [ref=e639]
              - row "Aditya Pillai aditya.pillai.125@dpsbangalore.edu.in STUDENT — Active" [ref=e640]:
                - cell "Aditya Pillai" [ref=e641]
                - cell "aditya.pillai.125@dpsbangalore.edu.in" [ref=e642]
                - cell "STUDENT" [ref=e643]
                - cell "—" [ref=e644]
                - cell "Active" [ref=e645]
              - row "Naveen Mehta naveen.mehta.124@gmail.com PARENT — Active" [ref=e646]:
                - cell "Naveen Mehta" [ref=e647]
                - cell "naveen.mehta.124@gmail.com" [ref=e648]
                - cell "PARENT" [ref=e649]
                - cell "—" [ref=e650]
                - cell "Active" [ref=e651]
              - row "Karthik Mehta karthik.mehta.124@dpsbangalore.edu.in STUDENT — Active" [ref=e652]:
                - cell "Karthik Mehta" [ref=e653]
                - cell "karthik.mehta.124@dpsbangalore.edu.in" [ref=e654]
                - cell "STUDENT" [ref=e655]
                - cell "—" [ref=e656]
                - cell "Active" [ref=e657]
              - row "Deepak Kulkarni deepak.kulkarni.123@gmail.com PARENT — Active" [ref=e658]:
                - cell "Deepak Kulkarni" [ref=e659]
                - cell "deepak.kulkarni.123@gmail.com" [ref=e660]
                - cell "PARENT" [ref=e661]
                - cell "—" [ref=e662]
                - cell "Active" [ref=e663]
              - row "Riya Kulkarni riya.kulkarni.123@dpsbangalore.edu.in STUDENT — Active" [ref=e664]:
                - cell "Riya Kulkarni" [ref=e665]
                - cell "riya.kulkarni.123@dpsbangalore.edu.in" [ref=e666]
                - cell "STUDENT" [ref=e667]
                - cell "—" [ref=e668]
                - cell "Active" [ref=e669]
              - row "Mahesh Iyer mahesh.iyer.122@gmail.com PARENT — Active" [ref=e670]:
                - cell "Mahesh Iyer" [ref=e671]
                - cell "mahesh.iyer.122@gmail.com" [ref=e672]
                - cell "PARENT" [ref=e673]
                - cell "—" [ref=e674]
                - cell "Active" [ref=e675]
              - row "Aditya Iyer aditya.iyer.122@dpsbangalore.edu.in STUDENT — Active" [ref=e676]:
                - cell "Aditya Iyer" [ref=e677]
                - cell "aditya.iyer.122@dpsbangalore.edu.in" [ref=e678]
                - cell "STUDENT" [ref=e679]
                - cell "—" [ref=e680]
                - cell "Active" [ref=e681]
              - row "Sanjay Reddy sanjay.reddy.121@gmail.com PARENT — Active" [ref=e682]:
                - cell "Sanjay Reddy" [ref=e683]
                - cell "sanjay.reddy.121@gmail.com" [ref=e684]
                - cell "PARENT" [ref=e685]
                - cell "—" [ref=e686]
                - cell "Active" [ref=e687]
              - row "Vihaan Reddy vihaan.reddy.121@dpsbangalore.edu.in STUDENT — Active" [ref=e688]:
                - cell "Vihaan Reddy" [ref=e689]
                - cell "vihaan.reddy.121@dpsbangalore.edu.in" [ref=e690]
                - cell "STUDENT" [ref=e691]
                - cell "—" [ref=e692]
                - cell "Active" [ref=e693]
              - row "Rajesh Menon rajesh.menon.120@gmail.com PARENT — Active" [ref=e694]:
                - cell "Rajesh Menon" [ref=e695]
                - cell "rajesh.menon.120@gmail.com" [ref=e696]
                - cell "PARENT" [ref=e697]
                - cell "—" [ref=e698]
                - cell "Active" [ref=e699]
              - row "Ayaan Menon ayaan.menon.120@dpsbangalore.edu.in STUDENT — Active" [ref=e700]:
                - cell "Ayaan Menon" [ref=e701]
                - cell "ayaan.menon.120@dpsbangalore.edu.in" [ref=e702]
                - cell "STUDENT" [ref=e703]
                - cell "—" [ref=e704]
                - cell "Active" [ref=e705]
              - row "Pradeep Saxena pradeep.saxena.119@gmail.com PARENT — Active" [ref=e706]:
                - cell "Pradeep Saxena" [ref=e707]
                - cell "pradeep.saxena.119@gmail.com" [ref=e708]
                - cell "PARENT" [ref=e709]
                - cell "—" [ref=e710]
                - cell "Active" [ref=e711]
              - row "Navya Saxena navya.saxena.119@dpsbangalore.edu.in STUDENT — Active" [ref=e712]:
                - cell "Navya Saxena" [ref=e713]
                - cell "navya.saxena.119@dpsbangalore.edu.in" [ref=e714]
                - cell "STUDENT" [ref=e715]
                - cell "—" [ref=e716]
                - cell "Active" [ref=e717]
              - row "Ashok Saxena ashok.saxena.118@gmail.com PARENT — Active" [ref=e718]:
                - cell "Ashok Saxena" [ref=e719]
                - cell "ashok.saxena.118@gmail.com" [ref=e720]
                - cell "PARENT" [ref=e721]
                - cell "—" [ref=e722]
                - cell "Active" [ref=e723]
              - row "Tanvi Saxena tanvi.saxena.118@dpsbangalore.edu.in STUDENT — Active" [ref=e724]:
                - cell "Tanvi Saxena" [ref=e725]
                - cell "tanvi.saxena.118@dpsbangalore.edu.in" [ref=e726]
                - cell "STUDENT" [ref=e727]
                - cell "—" [ref=e728]
                - cell "Active" [ref=e729]
              - row "Pradeep Sharma pradeep.sharma.117@gmail.com PARENT — Active" [ref=e730]:
                - cell "Pradeep Sharma" [ref=e731]
                - cell "pradeep.sharma.117@gmail.com" [ref=e732]
                - cell "PARENT" [ref=e733]
                - cell "—" [ref=e734]
                - cell "Active" [ref=e735]
              - row "Pari Sharma pari.sharma.117@dpsbangalore.edu.in STUDENT — Active" [ref=e736]:
                - cell "Pari Sharma" [ref=e737]
                - cell "pari.sharma.117@dpsbangalore.edu.in" [ref=e738]
                - cell "STUDENT" [ref=e739]
                - cell "—" [ref=e740]
                - cell "Active" [ref=e741]
              - row "Sandeep Reddy sandeep.reddy.116@gmail.com PARENT — Active" [ref=e742]:
                - cell "Sandeep Reddy" [ref=e743]
                - cell "sandeep.reddy.116@gmail.com" [ref=e744]
                - cell "PARENT" [ref=e745]
                - cell "—" [ref=e746]
                - cell "Active" [ref=e747]
              - row "Anvi Reddy anvi.reddy.116@dpsbangalore.edu.in STUDENT — Active" [ref=e748]:
                - cell "Anvi Reddy" [ref=e749]
                - cell "anvi.reddy.116@dpsbangalore.edu.in" [ref=e750]
                - cell "STUDENT" [ref=e751]
                - cell "—" [ref=e752]
                - cell "Active" [ref=e753]
              - row "Manoj Banerjee manoj.banerjee.115@gmail.com PARENT — Active" [ref=e754]:
                - cell "Manoj Banerjee" [ref=e755]
                - cell "manoj.banerjee.115@gmail.com" [ref=e756]
                - cell "PARENT" [ref=e757]
                - cell "—" [ref=e758]
                - cell "Active" [ref=e759]
              - row "Rishi Banerjee rishi.banerjee.115@dpsbangalore.edu.in STUDENT — Active" [ref=e760]:
                - cell "Rishi Banerjee" [ref=e761]
                - cell "rishi.banerjee.115@dpsbangalore.edu.in" [ref=e762]
                - cell "STUDENT" [ref=e763]
                - cell "—" [ref=e764]
                - cell "Active" [ref=e765]
              - row "Ashok Nair ashok.nair.114@gmail.com PARENT — Active" [ref=e766]:
                - cell "Ashok Nair" [ref=e767]
                - cell "ashok.nair.114@gmail.com" [ref=e768]
                - cell "PARENT" [ref=e769]
                - cell "—" [ref=e770]
                - cell "Active" [ref=e771]
              - row "Yash Nair yash.nair.114@dpsbangalore.edu.in STUDENT — Active" [ref=e772]:
                - cell "Yash Nair" [ref=e773]
                - cell "yash.nair.114@dpsbangalore.edu.in" [ref=e774]
                - cell "STUDENT" [ref=e775]
                - cell "—" [ref=e776]
                - cell "Active" [ref=e777]
              - row "Praveen Das praveen.das.113@gmail.com PARENT — Active" [ref=e778]:
                - cell "Praveen Das" [ref=e779]
                - cell "praveen.das.113@gmail.com" [ref=e780]
                - cell "PARENT" [ref=e781]
                - cell "—" [ref=e782]
                - cell "Active" [ref=e783]
              - row "Zara Das zara.das.113@dpsbangalore.edu.in STUDENT — Active" [ref=e784]:
                - cell "Zara Das" [ref=e785]
                - cell "zara.das.113@dpsbangalore.edu.in" [ref=e786]
                - cell "STUDENT" [ref=e787]
                - cell "—" [ref=e788]
                - cell "Active" [ref=e789]
  - region "Notifications alt+T"
  - alert [ref=e790]
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