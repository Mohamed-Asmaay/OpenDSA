class ActiveEquation{
    constructor(equation_obj, position_obj, id, jsavObject, globalPointerReference){
        this.name=id;
        //console.log(this.name);
        this.equationObjectReference = equation_obj;
        this.selected = false;
        this.jsavequation = null;
        this.variables = {};
        this.globalPointerReference = globalPointerReference;
        this.jsavObject = jsavObject;
        this.positionObj = position_obj;

        this.visualComponents = {};
        this.createVisualEquation(position_obj, jsavObject);
    }
    createVisualEquation(position_obj, jsavObject){
        // Adding a tickmark object that indicates which equation is selected
        this.visualComponents["tickmark"] = jsavObject.label(
            //"OK",
            "&#x2610",
            {
                left: position_obj["POSITION_X"],
                top: position_obj["POSITION_Y"]
            }
        ).addClass("tickselected");
        this.visualComponents["tickmark"].element[0].addEventListener("click", e => {
            e.stopPropagation();
            if(this.selected==true){
                this.selected = false;
                this.visualComponents["tickmark"].element[0].innerHTML = "&#x2610";
                this.visualComponents["tickmark"].addClass("tickunselected");
                // this.visualComponents["tickmark"].removeClass("tickselected");
                ;
                jsavObject.logEvent({type: "tick unselected", id: this.name});
            }
            else{
                this.selected = true;
                this.visualComponents["tickmark"].element[0].innerHTML = "&#x2611";
                this.visualComponents["tickmark"].addClass("tickselected");
                // this.visualComponents["tickmark"].removeClass("tickunselected");
                ;
                jsavObject.logEvent({type: "tick selected", id: this.name});
            }
        });

        // Creating the visual elements.
        this.visualComponents["text"] = jsavObject.label(
            katex.renderToString(this.equationObjectReference["latex"]),
            {
                left: position_obj["POSITION_X"]+
                this.visualComponents["tickmark"].element[0].offsetWidth+5,
                top: position_obj["POSITION_Y"]+3
            }
        ).addClass("selectableEquation");
        this.visualComponents["text"].element[0].addEventListener("click", e=> {
            Window.parentObject = this;
            this.subscriptizeEquationComponents();
        });

        /**
         * Add code her to add an additional span class to every single box,
         * and associate a click handler with that span class container, so that
         * elements inside this span class are substituted out.
         * Look for this: <span class="mord amsrm">□</span>
         */
        this.jsavequation = jsavObject.label(
            katex.renderToString(this.equationObjectReference["latex_boxes"]),
            {
                left: position_obj["POSITION_X"]+
                this.visualComponents["tickmark"].element[0].offsetWidth+5+
                this.visualComponents["text"].element[0].offsetWidth+30,
                top: position_obj["POSITION_Y"]
            }
        ).addClass("boxedEquation");

        var boxList = 
        this.jsavequation.element[0].childNodes[0].childNodes[1].childNodes[2]
        .querySelectorAll("span.mord.amsrm")
        //console.log(boxList);
        
        /**
         * Delegation: we handle the modification of the elements here, since we are
         * creating the boxes here. As for actually setting up the clickhandlers, 
         * that is done in the call to createVariableBoxes(), so we change the query
         * for qSA to look for the container.
         */
        
        for(var i=0; i<boxList.length; i++)
        {
            //var containerSpan = document.createElement("span");
            boxList[i].className = " boxparam";
            boxList[i].setAttribute("data-domain", "empty");
            //boxList[i].innerHTML = '<span class="mord amsrm">&#9634;</span>';
            boxList[i].innerHTML = 
            '<span class="mord value"></span><span class="mord unit"></span>';
        }

        // Immediately create the variable boxes
        this.createVariableBoxes();
    }
    createVariableBoxes(){
        // This one is associated with creating Variable objects to go hand-in-hand with
        // box/parameter positions in the boxed representation

        var boxList = this.jsavequation.element[0].childNodes[0].childNodes[1].childNodes[2]
        .querySelectorAll("span.boxparam");
        //console.log(boxList);
        for(var boxIndex=0; boxIndex<boxList.length; boxIndex++)
        {
            var name = Window.getVarName();
            var currentBox = boxList[boxIndex];
            this.variables[this.equationObjectReference.params[boxIndex]] = new Variable(
                this.name+this.equationObjectReference.params[boxIndex], // name unique to workspace, equation, and parameter
                this.equationObjectReference.params[boxIndex],
                name, // actual variable name to be used everywhere else.
                this.equationObjectReference.variables[this.equationObjectReference.params[boxIndex]],
                this.equationObjectReference.domains[this.equationObjectReference.params[boxIndex]],
                currentBox,
                this.globalPointerReference,
            )
        }
    }
    oldCreateSolvableRepresentation(){
        // DEPRECATED: Features of Nerdamer+peculiarities required us to do things differently.
        // Plus, this function is really messily written.
        // TO WORK SPECIFICALLY ON THIS PART, TO CREATE THE SOLVABLE REPRESENTATION AND FINALLY, SOLUTION BOX
        var splitString = this.equationObjectReference.template.split(" ");
        for(var x=0; x<splitString.length; x++)
        {
            if(splitString[x], splitString[x] in this.variables)
            {
                if(this.variables[splitString[x]].value!=null)
                    splitString[x] = this.variables[splitString[x]].value;
                else
                {
                    // If this is called, there will be more than one unknown in the system.
                    // So, we need the current symbol, which would in turn be assigned by the
                    // corresponding Association object.
                    //splitString[x] = this.variables[splitString[x]].currentSymbol;
                    if(this.variables[splitString[x]].value == null){
                        // Then this is probably a single equation solving scenario, use id.
                        splitString[x] = this.variables[splitString[x]].currentSymbol;
                    }
                    else if(this.variables[splitString[x]].valueType == "number"){
                        splitString[x] = this.variables[splitString[x]].value;
                    }
                    else {
                        // it's an association, look up appropriate field.
                        //splitString[x] = this.variables[splitString[x]].value.varID;
                    }
                }
            }
        }
        return splitString.join(" ");
    }
    createSolvableRepresentation(){
        var unitEquationSet = [];
        var unknowns = {};
        var splitString = this.equationObjectReference.template.split(" ");
        for(var x=0; x<splitString.length; x++)
        {
            // DEBUG:
            // console.log(splitString[x]);
            
            // if(splitString[x], splitString[x] in this.variables)
            if(splitString[x] in this.variables)
            {
                if(this.variables[splitString[x]].valueType=="number")
                {
                    // Add the variable=value assignment separately, putting only
                    // variables in the equation representation.
                    unitEquationSet.push(
                        this.variables[splitString[x]].currentSymbol+
                        "="+this.variables[splitString[x]].value
                        );
                    splitString[x] = this.variables[splitString[x]].currentSymbol;
                }
                else
                {
                    // This just means that there is an association -> valueType="association"
                    // Unlike the previous version, in our case, we will always have >1 equation.
                    // So, we simply check for the term, and call on its representation variable.
                    if(this.variables[splitString[x]].valueType=="association")
                    {
                        var ps = this.variables[splitString[x]].value.varDisplay;
                        // splitString[x] = this.variables[splitString[x]].value.var;
                        // unknowns[this.variables[splitString[x]].value.var] = ps;
                        var subject = this.variables[splitString[x]].value.var;
                        if(this.variables[splitString[x]].valueNegated)
                            splitString[x] = "(-"+subject+")";
                        else splitString[x] = subject;
                        unknowns[subject] = ps;
                    }
                    else
                    {
                        // OR it's a single unmarked, unconnected unknown
                        var ps = this.variables[splitString[x]].parentSymbol;
                        // splitString[x] = this.variables[splitString[x]].currentSymbol;
                        // unknowns[splitString[x]] = ps;
                        var subject = this.variables[splitString[x]].currentSymbol;
                        if(this.variables[splitString[x]].valueNegated)
                            splitString[x] = "(-"+subject+")";
                        else splitString[x] = subject;
                        unknowns[subject] = ps;
                    }
                }
            }
        }
        unitEquationSet.push(splitString.join(" "));
        return {
            "equations": unitEquationSet,
            "unknowns": unknowns
        };
    }
    solve()
    {
        // Insert checking mechanism first, this is a complete functionality.
        
        //Then, solve it.
        var splitString = this.equationObjectReference.template.split(" ");
        var subject = null;
        
        for(var x=0; x<splitString.length; x++)
        {
            if(splitString[x] in this.variables)
            {
                if(this.variables[splitString[x]].valueType=="number")
                    splitString[x] = this.variables[splitString[x]].value;
                else
                {
                    // This just means that there is an association -> valueType="association"
                    // Unlike the previous version, in our case, we will always have >1 equation.
                    // So, we simply check for the term, and call on its representation variable.
                    if(this.variables[splitString[x]].valueType=="association")
                    {
                        // var ps = this.variables[splitString[x]].value.varDisplay;
                        splitString[x] = this.variables[splitString[x]].value.var;
                        if(this.variables[splitString[x]].valueNegated)
                            splitString[x] = "(-"+subject+")";
                        else splitString[x] = subject;
                    }
                    else
                    {
                        // OR it's a single unmarked, unconnected unknown
                        // var ps = this.variables[splitString[x]].parentSymbol;
                        subject = this.variables[splitString[x]].currentSymbol;
                        if(this.variables[splitString[x]].valueNegated)
                            splitString[x] = "(-"+subject+")";
                        else splitString[x] = subject;
                    }
                }
            }
        }
        var solutions = nerdamer.solveEquations(
            [splitString.join(" "),
            subject+" = x + 1"]
            );
        console.log(solutions);
        for(var i in solutions)
        {
            if(solutions[i][0] == subject)
            {
                return [solutions[i]];
            }
        }
        //Substitute the random symbol name with the proper qualified variable name
    }
    subscriptizeEquationComponents(){
        // Steps:
        // 1. Add subscripts to all the elements in the equation in the represented version
        // 2. Add subscripts to all the grayed out boxes in the boxed equation
        // 3. For all filled boxes with Association type objects, add subscripts
        // 4. For ALL of these cases, add subscripts to both the text representation as well as the visual representation.

        // console.log(this);
        var inputPromptHTML = 
        '<h4>Enter a subscript name here.</h4>'+
        '<input type="text" id="subscriptname" name="subscriptname" size="8" />'+
        '<input type="button" id="submit" value="Set subscript"/>';

        var inputBox = JSAV.utils.dialog(inputPromptHTML, {width: 150});
        inputBox[0].style.top = event.pageY+5+"px";
        inputBox[0].style.left = event.pageX+10+"px";
        Window.box = inputBox;
        inputBox[0].querySelector("#submit").addEventListener("click", Window.parentObject.setSubscript);
    }
    setSubscript(event)
    {
        var subscriptText = Window.box[0].querySelector("#subscriptname").value;
        event.stopPropagation();
        if(subscriptText == "") subscriptText = " ";
        
        // Step 1.
        Window.parentObject.visualComponents["text"].text(
            katex.renderToString(
                Window.parentObject.equationObjectReference.latex.replace(new RegExp('\{ \}', 'g'),"{"+subscriptText+"}")
                )
            );
        
        var assocVariables = [];
        for(var variable in Window.parentObject.variables)
        {
            // Update the variable internal symbols for later associations and solving
            // This can be referenced from the current equation's equationRefObj and the variable's semantic name.

            // Update the current displayed boxes
            // Step 2.
            if(Window.parentObject.variables[variable].valueType == null)
            {
                // .replace(new RegExp('\{ \}', 'g'),"{"+subscriptText+"}")
                Window.parentObject.variables[variable].parentSymbol = 
                Window.parentObject.variables[variable].parentSymbolTemplate.replace(
                    new RegExp('\{ \}', 'g'),"{"+subscriptText+"}");
                Window.parentObject.variables[variable].grayOut();
            }
            // Step 3.
            else if(Window.parentObject.variables[variable].valueType == "association")
            {
                Window.parentObject.variables[variable].value.varDisplay = 
                    Window.parentObject.variables[variable].value.varDisplayTemplate.replace(
                        new RegExp('\{ \}', 'g'),"{"+subscriptText+"}");
                Window.parentObject.variables[variable].value.updateVarDisplay();
            }
        }

        Window.box.close();
        delete Window.box;
        delete Window.parentObject;
    }
    getUnitOfVariable(varName)
    {
        // Find the unknown variable - which can be an option later, if no parameter is passed.
        // var varName = null;
        console.log("in getUnitOfVariable for"+varName);
        // NOTES: In our observation, we can either have an unknown that has an association, or that does not (i.e. is null).
        // If an unknown is associated, then it maybe difficult to compute its domain from inside 
        // especially if this equation contains atleast one unknown with a weird datatype.
        // PLACEHOLDER FOR POTENTIAL HACK

        // If an unknown is null (not associated), then we want to spend sometime computing its domain.
        var splitString = this.equationObjectReference.template.split(" ");
        for(var x=0; x<splitString.length; x++)
        {
            if(splitString[x] in this.variables)
            {
                if(this.variables[splitString[x]].value == null || this.variables[splitString[x]].valueType == "number")
                {
                    // Single solver; one unknown, with
                    splitString[x] = this.variables[splitString[x]].currentSymbol;
                }
                else if(this.variables[splitString[x]].valueType == 'association')
                {
                    // if there is an association, adds that automatically.
                    splitString[x] = this.variables[splitString[x]].value.var;
                }
                // No need for the numbers, we only need the variable symbols.
            }
        }
        var equation = nerdamer(splitString.join(" "));
        var substituted = equation.solveFor(varName).toString() // Only reference of varName, used when the 
        var values = {};
        var flagIndeterminate = false;
        for(var v in this.variables)
        {
            // This assumes that this is for a single variable solving scenario.
            if(this.variables[v].valueType == "number")
            {
                values[this.variables[v].currentSymbol] = '1 '+this.variables[v].currentUnit;
            }
            else if(this.variables[v].valueType == "association")
            {
                // The domain is this case would obviously be unknown.
                // For now, use the expected domain attribute of the variable to find the corresponding base unit
                // console.log(
                //     "Can we find the right unit?",
                //     this.variables[v].value.domain,
                //     Window.defaultDomains[this.variables[v].value.domain],
                //     Window.defaultDomains[this.variables[v].value.domain][Window.unitFamily],
                //     )
                var unitName = Window.defaultDomains[this.variables[v].value.domain][Window.unitFamily];
                // values[this.variables[v].currentSymbol] = '1 '+
                values[this.variables[v].value.var] = '1 '+
                    Window.UNIT_DB[this.variables[v].value.domain][unitName]['unit'];
                // console.log("Did we find the right unit?",values[this.variables[v].currentSymbol]);
            }
            else if(this.variables[v].valueType == null)
            {
                // Probably the unknown we would calculate things for anyway; it hasn't been associated yet.
                // Don't worry about it; this will certainly be the one we will be calculating the unit for.
                // However, if we need the unit for this thing to infer the unit of something else, then enable this.
                if (this.equationObjectReference.group == 'Arithmetic') {
                    // Special case, this is needed because everything else (mult, div, etc.) can fix itself (UPDATE: Maybe not)
                    // values[this.variables[v].currentSymbol] = ''; // Just leave it blank, let the rest of the units determine the rest.

                    // When it comes here, either this.variables[v] is the varName whose unit is requested,
                    // or this is the varName whose unit will be used for inference.
                    // For the first case, we can leave it blank.
                    if (varName == this.variables[v].currentSymbol) // It's not an assoc, otherwise it wouldn't be null
                        values[this.variables[v].currentSymbol] = '';
                    // Else, we abort and directly return the expectedDomain and corresponding unit for the requested variable.
                    // We already have some info to go off of, we don't need to waste anymore time.
                    else {
                        flagIndeterminate = true;
                    }
                }
                else {
                    var unitName = Window.defaultDomains[this.variables[v].expectedDomain][Window.unitFamily];
                    values[this.variables[v].currentSymbol] = '1 '+ Window.UNIT_DB[this.variables[v].expectedDomain][unitName]['unit'];
                }
                // Alternatively; try to find out what the unit for this thing should be, then use it for this one.
                // values[this.variables[v].currentSymbol] = '1 '+ this.getUnitOfVariable(this.variables[v].currentSymbol)[1];
            }
        }
        // By this point, things have been calculated, and can be indexed by the proper variable name.
        if(flagIndeterminate) {
            var resultUnit = values[varName].split(" ")[1];
            if(resultUnit in Window.unitDomainMap)
                var domain = Window.unitDomainMap[resultUnit];
            else
                var domain = "unknown"; // temporary fix
            return [varName, resultUnit, domain];
        }
        // console.log(substituted);
        // console.log(values);
        for(var v in values)
        {
            substituted = substituted.replace(v,"("+values[v]+")");
        }
        console.log(substituted);
        var resultUnit = mathjs.evaluate(substituted).toString().split(" ")[1];
        if(resultUnit in Window.unitDomainMap)
            var domain = Window.unitDomainMap[resultUnit];
        else
            var domain = "unknown"; // temporary fix
        return [varName, resultUnit, domain];
    }
}
window.ActiveEquation = window.ActiveEquation || ActiveEquation