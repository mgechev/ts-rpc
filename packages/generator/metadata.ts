export interface TypeSymbol {
  name: string;
  path: string;
  params?: TypeSymbol[];
  // For type literals
  nested?: TypeSymbol[];
}

export interface Argument {
  type: TypeSymbol;
  name: string;
}

export interface Method {
  name: string;
  sideEffect: boolean;
  arguments: Argument[];
  returnType: TypeSymbol;
}

export interface Service {
  name: string;
  path: string;
  methods: Method[];
}
