# MEMORANDUM: Progetto Gestione Polizza "CatNat & Property" \- OVS

**Data:** 24 Novembre 2025  
**Oggetto:** Analisi requisiti e specifiche funzionali piattaforma gestione punti vendita

L'obiettivo è trasformare un'esigenza commerciale complessa (gestione massiva di 1.000-1.500 punti vendita OVS con frequente turnover) in un flusso digitale strutturato, scalabile e, soprattutto, realizzabile in tempi strettissimi (entro fine anno).

Di seguito si riporta la sintesi ragionata e le macro-specifiche funzionali derivate dalla discussione.

## 1\. Sintesi e contesto 

Gruppo MAG sta chiudendo un accordo per assicurare l'intera rete OVS (circa 1.000-1.500 punti vendita) per rischi CatNat (Catastrofi Naturali). La sfida è la **gestione operativa del flusso dati**: OVS ha bisogno di un sistema che permetta ai singoli punti vendita di verificare la propria copertura, scaricare il certificato (personalizzato) e accedere alle istruzioni in caso di sinistro, gestendo al contempo la dinamicità della rete (nuove aperture, chiusure, trasferimenti).

L'approccio manuale, basato su scambi di file o semplici repository documentali, è stato giudicato insufficiente o rischioso per la gestione delle variazioni di rischio. Si rende necessaria una soluzione tecnologica più evoluta.

---

## 2\. Analisi dei flussi operativi (As-Is vs To-Be)

Dalla riunione emerge la necessità di gestire due flussi distinti ma interconnessi:

### A. Flusso Amministrativo (Corporate)

* **Attori:** OVS Headquarter (Contraente) e MAG (Broker).  
* **Input:** OVS detiene la "verità" sui punti vendita attivi. Ogni variazione (inclusione/esclusione store) deve essere validata da OVS.  
* **Processo:** OVS invia periodicamente (es. file Excel mensile) l'elenco aggiornato degli store con i relativi metri quadri.  
* **Calcolo:** Il premio e le somme assicurate sono standardizzati tramite un algoritmo basato sulla superficie in mq (es. 2.000 mq \* tasso concordato).  
* **Output:** Regolazione del premio con la Compagnia e aggiornamento del database assicurati.

### B. Flusso utente finale (Punto Vendita)

* **Attori:** Responsabile del singolo negozio.  
* **Esigenza:** Deve sapere se è coperto, per quanto (somme assicurate), e cosa fare se succede qualcosa.  
* **Criticità:** Se un negozio cambia indirizzo o chiude, o comunque modifica i parametri relativi alla quotazione (es. mq) l'accesso e le informazioni devono aggiornarsi tempestivamente per evitare "buchi" di copertura o false aspettative.

---

## 3\. Macro specifiche funzionali

In qualità di tech partner, traduco le esigenze emerse in specifiche tecniche per la soluzione. La soluzione ipotizzata si ispira alla struttura di "MAG Benefit" ma adattata al contesto Property/Cat-Nat.

### 3.1 Backend & Data Ingestion

1. **Modulo di Importazione Dati:**  
   * Capacità di ingerire file strutturati (Excel/CSV) provenienti da OVS.  
   * Mapping dei campi essenziali: Codice Punto Vendita, Ragione Sociale, Indirizzo/Ubicazione Rischio, Metri Quadri.  
2. **Motore di Calcolo (Pricing Engine):**  
   * Applicazione automatica dell'algoritmo di calcolo: *Mq \* Tasso \= Premio/Somma Assicurata*.  
   * Le condizioni normative sono uguali per tutti, variano solo i capitali assicurati.  
3. **Gestione Lifecycle (Entrate/Uscite):**  
   * Il sistema deve gestire lo "storico": data attivazione e data cessazione copertura per singolo punto vendita.  
   * Disattivazione automatica delle utenze per i negozi chiusi.

### 3.2 Frontend (User Experience \- Store Manager)

1. **Accesso Riservato:**  
   * Login per singolo punto vendita.  
2. **Dashboard Personalizzata ("My Policy"):**  
   * Visualizzazione immediata dello stato: "Attivo/Non Attivo".  
   * Visualizzazione Somme Assicurate specifiche per quel negozio (Fabbricato, Contenuto, ecc.).  
   * Visualizzazione Ubicazione del rischio assicurato (fondamentale in caso di trasferimenti).  
3. **Area Documentale:**  
   * Download Certificato di Assicurazione.  
   * Download Fascicolo Informativo/Condizioni di Polizza (uguale per tutti).  
   * Manuale operativo Sinistri, anche in forma di assistente virtuale conversazionale, e riferimenti contatti (uguale per tutti)

### 3.3 Output & Reporting

1. **Flusso verso Compagnia:** Export dei dati per le appendici di regolazione premio e emissione certificati.  
2. **Log delle Variazioni:** Tracciamento di tutte le modifiche per audit trail tra OVS e MAG.

---

## 4\. Considerazioni Tecnologiche

* **Time-to-Market:** L’obiettivo è traguardare l’operatività del sistema per dicembre/gennaio.  
* **Qualità del Dato:** Il successo dipende dalla pulizia del file Excel gestito da OVS. Se OVS non comunica tempestivamente un trasferimento, il rischio rimane assicurato sulla vecchia ubicazione.  
* **Comunicazione:** Serve un sistema automatizzato (email transazionali) che avvisi lo store manager dell'attivazione o cessazione della copertura, complementando e semplificando la gestione.

